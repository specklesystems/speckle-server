import { MaybeAsync, Optional, md5, wait } from '@speckle/shared'
import { dbNotificationLogger } from '@/logging/logging'
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
    if (val.setup) continue

    connection.query(`LISTEN ${key}`)
    listeners[key].setup = true
  }
}

function setupConnection(connection: pg.Connection) {
  Object.values(listeners).forEach((l) => (l.setup = false))
  connection.on('notification', messageProcessor)

  connection.on('end', () => {
    if (!shuttingDown) reconnectClient()
  })
  connection.on('error', (err: unknown) => {
    dbNotificationLogger.error(err, 'Notification listener connection error')
  })
  setupListeners(connection)
}

function reconnectClient() {
  const reconnect = async () => {
    try {
      await endConnection()

      dbNotificationLogger.info('Attempting to (re-)connect...')

      const newConnection = await (
        knex.client as Knex.Knex.Client
      ).acquireRawConnection()

      connection = newConnection
      redisClient = createRedisClient(getRedisUrl(), {})

      setupConnection(newConnection)
    } catch (e: unknown) {
      dbNotificationLogger.error(
        e,
        'Notification listener connection acquisition failed'
      )
      throw e
    }
  }

  void reconnect().catch(async () => {
    await wait(5000) // Wait 5s and retry
    reconnectClient()
  })
}

const endConnection = async () => {
  dbNotificationLogger.info('Ending connection...')

  if (connection) {
    connection.end()
    connection = undefined
  }

  if (redisClient) {
    await redisClient.quit()
    redisClient = undefined
  }
}

export function setupResultListener() {
  dbNotificationLogger.info('🔔 Initializing postgres notification listening...')
  reconnectClient()
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
