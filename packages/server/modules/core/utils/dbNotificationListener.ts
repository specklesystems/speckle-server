import { MaybeAsync, Optional } from '@speckle/shared'
import { dbNotificationLogger } from '@/logging/logging'
import { knex } from '@/modules/core/dbSchema'
import * as Knex from 'knex'
import * as pg from 'pg'
import { createRedisClient } from '@/modules/shared/redis/redis'
import {
  forceDbNotificationListenerLocking,
  getRedisUrl,
  isProdEnv
} from '@/modules/shared/helpers/envHelper'
import { randomUUID } from 'crypto'

/**
 * TODO: This currently will emit duplicate events when there are multiple server instances running. Not a big deal currently while there aren't that many events,
 * but we need to figure this out
 */

export type MessageType = { channel: string; payload: string }
export type ListenerType = (msg: MessageType) => MaybeAsync<void>

let shuttingDown = false
let connection: Optional<pg.Connection> = undefined
let lockRelease: Optional<() => Promise<void>> = undefined
const uid = randomUUID()
const listeners: Record<string, { setup: boolean; listener: ListenerType }> = {}
const lockName = 'server_postgres_listener_lock'

function messageProcessor(msg: MessageType) {
  const listener = listeners[msg.channel]
  dbNotificationLogger.info(
    {
      ...msg,
      listenerRegistered: !!listener
    },
    'Message received in channel {channel}'
  )
  if (!listener) return

  return listener.listener(msg)
}

async function getLock() {
  // Use lock in redis to ensure that only one instance of the server is listening for events
  const redisClient = createRedisClient(getRedisUrl(), {})
  const lock = await redisClient.set(lockName, uid, 'NX')
  const releaseLock = async () => {
    const lockValue = await redisClient.get(lockName)
    if (lockValue === uid) {
      await redisClient.del(lockName)
    }
  }
  return lock ? releaseLock : null
}

function setupListeners(connection: pg.Connection) {
  for (const [key, val] of Object.entries(listeners)) {
    if (val.setup) continue

    connection.query(`LISTEN ${key}`)
    listeners[key].setup = true
  }
}

async function setupConnection(connection: pg.Connection) {
  if (isProdEnv() || forceDbNotificationListenerLocking()) {
    if (!lockRelease) {
      lockRelease = (await getLock()) || undefined
    }

    if (!lockRelease) {
      dbNotificationLogger.info('Could not acquire lock, not setting up listeners...')
      return
    } else {
      dbNotificationLogger.info('Lock acquired, setting up listeners...')
    }
  }

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
  const interval = setInterval(async () => {
    try {
      const newConnection = await (
        knex.client as Knex.Knex.Client
      ).acquireRawConnection()
      connection = newConnection

      clearInterval(interval)
      await setupConnection(newConnection)
    } catch (e: unknown) {
      dbNotificationLogger.error(
        e,
        'Notification listener connection acquisition failed'
      )
    }
  }, 3000)
}

export async function forceClearLock() {
  const redisClient = createRedisClient(getRedisUrl(), {})
  await redisClient.del(lockName)
}

export function setupResultListener() {
  dbNotificationLogger.info('🔔 Initializing postgres notification listening...')
  reconnectClient()
}

export async function shutdownResultListener() {
  dbNotificationLogger.info('...Shutting down postgres notification listening')
  shuttingDown = true

  if (connection) {
    connection.end()
    connection = undefined
  }

  if (lockRelease) {
    await lockRelease()
    lockRelease = undefined
  }
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
