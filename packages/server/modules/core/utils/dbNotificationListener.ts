import { MaybeAsync, Optional } from '@speckle/shared'
import { dbNotificationLogger, moduleLogger } from '@/logging/logging'
import { knex } from '@/modules/core/dbSchema'
import * as Knex from 'knex'
import * as pg from 'pg'

/**
 * TODO: This currently will emit duplicate events when there are multiple server instances running. Not a big deal currently while there aren't that many events,
 * but we need to figure this out
 */

export type MessageType = { channel: string; payload: string }
export type ListenerType = (msg: MessageType) => MaybeAsync<void>

let shuttingDown = false
let connection: Optional<pg.Connection> = undefined
const listeners: Record<string, { setup: boolean; listener: ListenerType }> = {}

function messageProcessor(msg: MessageType) {
  const listener = listeners[msg.channel]
  dbNotificationLogger.info(
    {
      ...msg,
      listenerRegistered: !!listener
    },
    'Message received'
  )
  if (!listener) return

  return listener.listener(msg)
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
  const interval = setInterval(async () => {
    try {
      const newConnection = await (
        knex.client as Knex.Knex.Client
      ).acquireRawConnection()
      connection = newConnection

      clearInterval(interval)
      setupConnection(newConnection)
    } catch (e: unknown) {
      dbNotificationLogger.error(
        e,
        'Notification listener connection acquisition failed'
      )
    }
  }, 3000)
}

export function setupResultListener() {
  moduleLogger.info('🔔 Initializing postgres notification listening...')
  reconnectClient()
}

export function shutdownResultListener() {
  moduleLogger.info('...Shutting down postgres notification listening')
  shuttingDown = true
  if (connection) {
    connection.end()
    connection = undefined
  }
}

export function listenFor(eventName: string, cb: ListenerType) {
  listeners[eventName] = {
    setup: false,
    listener: cb
  }

  if (connection) {
    setupListeners(connection)
  }
}
