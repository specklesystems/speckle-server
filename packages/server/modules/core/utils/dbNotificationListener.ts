import type { MaybeAsync, Optional } from '@speckle/shared'
import { md5, wait } from '@speckle/shared'
import { dbNotificationLogger } from '@/observability/logging'
import pg from 'pg'
import { createRedisClient } from '@/modules/shared/redis/redis'
import {
  getRedisUrl,
  isProdEnv,
  postgresConnectionCreateTimeoutMillis
} from '@/modules/shared/helpers/envHelper'
import type Redis from 'ioredis'
import { LogicError, MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { mainDb } from '@/db/knex'
import type { PartialDeep } from 'type-fest'
import { merge } from 'lodash-es'
import {
  getConnectionSettings,
  obfuscateConnectionString
} from '@speckle/shared/environment/db'
import { getMainRegionConfig } from '@/modules/multiregion/regionConfig'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'

export type MessageType = pg.Notification
export type ListenerType = (msg: MessageType) => MaybeAsync<void>
type ConnectionStateItem = {
  setupListeners: {
    [listenerName: string]: boolean | undefined
  }
}

let shuttingDown = false
let connection: Optional<pg.Client> = undefined
let redisClient: Optional<Redis> = undefined
let activeReconnect: Optional<Promise<void>> = undefined

const connectionState = new WeakMap<pg.Client, ConnectionStateItem>()
const listeners: Record<string, { listener: ListenerType }> = {}
const lockName = 'server_postgres_listener_lock'

const updateConnectionState = (
  connection: pg.Client,
  update: PartialDeep<ConnectionStateItem>
) => {
  const state = connectionState.get(connection) || {
    setupListeners: {}
  }
  const newState = merge(state, update)
  connectionState.set(connection, newState)
}

function getMessageId(msg: MessageType) {
  const str = JSON.stringify(msg)
  return md5(str)
}

async function getTaskLock(taskId: string) {
  if (!redisClient) {
    throw new LogicError(
      'Unexpected failure! Attempting to get task lock before redis client is initialized'
    )
  }

  const lockKey = `${lockName}:${taskId}`
  const lock = await redisClient.set(lockKey, '1', 'EX', 60, 'NX')
  const releaseLock = async () => {
    if (!redisClient) {
      throw new LogicError(
        'Unexpected failure! Attempting to release task lock before redis client is initialized'
      )
    }
    await redisClient.del(lockKey)
  }
  return lock ? releaseLock : null
}

async function messageProcessor(msg: MessageType) {
  const listener = listeners[msg.channel]
  const messageId = getMessageId(msg)

  const logPayload = {
    ...msg,
    listenerRegistered: !!listener,
    messageId
  }
  if (!listener) return

  // Only process if lock acquired
  const unlock = await getTaskLock(messageId)
  if (unlock) {
    dbNotificationLogger.info(
      logPayload,
      'Message #{messageId} of channel {channel} starting processing...'
    )
    await Promise.resolve(listener.listener(msg))
    await unlock()
  } else {
    dbNotificationLogger.debug(
      logPayload,
      'Message #{messageId} of channel {channel} skipped due to missing lock...'
    )
  }
}

const setupListeners = async (connection: pg.Client) => {
  for (const [key] of Object.entries(listeners)) {
    const isSetupAlready = !!connectionState.get(connection)?.setupListeners?.[key]
    dbNotificationLogger.info(
      {
        key,
        setup: isSetupAlready
      },
      'Setting up PG listener for channel {key}...'
    )
    if (isSetupAlready) continue

    await connection.query(`LISTEN ${key}`)
    updateConnectionState(connection, {
      setupListeners: {
        [key]: true
      }
    })
  }
}

const setupConnection = async (connection: pg.Client) => {
  connection.on('notification', (msg) => {
    dbNotificationLogger.info({ msg }, 'Message incoming...')
    void messageProcessor(msg).catch((err) => {
      dbNotificationLogger.error({ err, msg }, `Error processing notification...`)
    })
  })

  connection.on('end', () => {
    dbNotificationLogger.info(
      {
        shuttingDown
      },
      'Notification listener connection ended'
    )

    if (!shuttingDown) void memoizedReconnect()
  })

  connection.on('error', (err: unknown) => {
    dbNotificationLogger.error(err, 'Notification listener connection error')
  })

  await setupListeners(connection)
}

/**
 * We have to skip the connection pool, cause it breaks LISTEN/NOTIFY. Thus, if available,
 * we're using the main DB connection settings from the multiRegion config
 */
const getDbConnectionSettings = async (): Promise<pg.ClientConfig> => {
  const base = getConnectionSettings(mainDb)

  if (isMultiRegionEnabled() && isProdEnv()) {
    const {
      postgres: { privateConnectionUri }
    } = await getMainRegionConfig()
    if (privateConnectionUri) {
      return {
        ...base,
        connectionString: privateConnectionUri
      }
    }
  }

  return base
}

const reconnect = async () => {
  try {
    await endConnection()

    const connectionSettings = await getDbConnectionSettings()
    const mainDbConnectionString = obfuscateConnectionString(
      connectionSettings.connectionString || ''
    )

    dbNotificationLogger.info(
      {
        mainDbConnectionString
      },
      'Attempting to (re-)connect...'
    )

    // creating externally managed PG connection from knex mainDB connection settings
    const newConnection = new pg.Client({
      ...connectionSettings,
      connectionTimeoutMillis: postgresConnectionCreateTimeoutMillis()
    })

    // connect and test
    await newConnection.connect()
    const test = await newConnection.query('SELECT NOW()')
    if (!test || !test.rows || test.rows.length === 0) {
      throw new MisconfiguredEnvironmentError(
        'Failed to acquire a valid connection to the database'
      )
    }

    connection = newConnection
    redisClient = createRedisClient(getRedisUrl(), {})

    await setupConnection(newConnection)
  } catch (e: unknown) {
    dbNotificationLogger.error(e, 'Notification listener connection acquisition failed')
    throw e
  }

  dbNotificationLogger.info('Client reconnect successful!')
}

const reconnectUntilSuccessful = async (): Promise<void> => {
  try {
    await reconnect()
  } catch {
    dbNotificationLogger.info('Retrying reconnection in 5 seconds...')
    await wait(5000) // Wait 5s and retry
    return reconnectUntilSuccessful()
  }
}

const memoizedReconnect = (): Promise<void> => {
  if (!activeReconnect) {
    activeReconnect = reconnectUntilSuccessful()
      .catch((e) => {
        dbNotificationLogger.error(e, 'Error during reconnect attempt')
        throw e
      })
      .finally(() => {
        activeReconnect = undefined
      })
  }

  return activeReconnect
}

const endConnection = async () => {
  dbNotificationLogger.info('Ending connection...')

  if (connection) {
    await connection.end()
  }

  if (redisClient) {
    await redisClient.quit()
    redisClient = undefined
  }
}

export async function setupResultListener() {
  dbNotificationLogger.info('🔔 Initializing postgres notification listening...')
  await memoizedReconnect()
}

export async function shutdownResultListener() {
  dbNotificationLogger.info('...Shutting down postgres notification listening')
  shuttingDown = true
  await endConnection()
}

export async function listenFor(eventName: string, cb: ListenerType) {
  dbNotificationLogger.info(
    { eventName },
    'Registering postgres event listener for {eventName}'
  )

  listeners[eventName] = {
    listener: cb
  }

  if (connection) {
    await setupListeners(connection)
  }
}
