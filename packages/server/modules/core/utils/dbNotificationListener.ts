import { MaybeAsync, Optional, md5, wait } from '@speckle/shared'
import { dbNotificationLogger } from '@/observability/logging'
import { knex } from '@/modules/core/dbSchema'
import * as Knex from 'knex'
import * as pg from 'pg'
import { createRedisClient } from '@/modules/shared/redis/redis'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import Redis from 'ioredis'
import { LogicError } from '@/modules/shared/errors'

export type MessageType = { channel: string; payload: string }
export type ListenerType = (msg: MessageType) => MaybeAsync<void>

let shuttingDown = false
let connection: Optional<pg.Connection> = undefined
let redisClient: Optional<Redis> = undefined
let activeReconnect: Optional<Promise<void>> = undefined

const listeners: Record<string, { setup: boolean; listener: ListenerType }> = {}
const lockName = 'server_postgres_listener_lock'

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
  dbNotificationLogger.info(
    logPayload,
    'Message #{messageId} of channel {channel} incoming...'
  )

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

function setupListeners(connection: pg.Connection) {
  for (const [key, val] of Object.entries(listeners)) {
    dbNotificationLogger.info(
      {
        key,
        setup: val.setup
      },
      'Setting up PG listener for channel {key}...'
    )
    if (val.setup) continue

    connection.query(`LISTEN ${key}`)
    listeners[key].setup = true
  }
}

function setupConnection(connection: pg.Connection) {
  Object.values(listeners).forEach((l) => (l.setup = false))
  connection.on('notification', (msg) => {
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
  setupListeners(connection)
}

const reconnect = async () => {
  try {
    await endConnection()

    dbNotificationLogger.info('Attempting to (re-)connect...')

    const newConnection = await (knex.client as Knex.Knex.Client).acquireRawConnection()

    connection = newConnection
    redisClient = createRedisClient(getRedisUrl(), {})

    setupConnection(newConnection)
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
    await (knex.client as Knex.Knex.Client).destroyRawConnection(connection)
    connection = undefined
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

export function listenFor(eventName: string, cb: ListenerType) {
  dbNotificationLogger.info(
    { eventName },
    'Registering postgres event listener for {eventName}'
  )

  listeners[eventName] = {
    setup: false,
    listener: cb
  }

  if (connection) {
    setupListeners(connection)
  }
}
