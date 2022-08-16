import { NotificationMessage } from '@/modules/notifications/helpers/types'
import { MaybeAsync } from '@/modules/shared/helpers/typeHelper'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { EventEmitter } from 'node:events'

const debug = modulesDebug.extend('notifications-events')

const errHandler = (e: unknown) => {
  debug(e)
}

const eventEmitter = new EventEmitter()
eventEmitter.on('uncaughtException', errHandler)
eventEmitter.on('error', errHandler)

export enum NotificationsEvents {
  Published = 'published',
  Consumed = 'consumed',
  Acknowledged = 'acknowledged'
}

// Add mappings between event types and expected payloads here
export type NotificationsEventPayloadMap = {
  [NotificationsEvents.Published]: { notification: NotificationMessage }
  [NotificationsEvents.Consumed]: { notification: NotificationMessage; msgId: string }
  [NotificationsEvents.Acknowledged]: {
    notification?: NotificationMessage
    ack: boolean
    msgId: string
    err?: Error
  }
} & { [k in NotificationsEvents]: unknown }

export type NotificationsEventHandler<T extends NotificationsEvents> = (
  payload: NotificationsEventPayloadMap[T]
) => MaybeAsync<void>

/**
 * Emit a notifications event
 */
export function emitNotificationsEvent<T extends NotificationsEvents>(
  eventName: T,
  payload: NotificationsEventPayloadMap[T]
) {
  eventEmitter.emit(eventName, payload)
}

/**
 * Listens to a event
 * @returns Function to invoke to stop listening
 */
export function onNotificationsEvent<T extends NotificationsEvents>(
  eventName: T,
  handler: NotificationsEventHandler<T>,
  params: { once?: boolean } = {}
) {
  const { once } = params || {}

  const onHandler = (event: NotificationsEventPayloadMap[T]) => {
    // This is important: Without this errors in async event handlers will
    // kill the process
    try {
      // In case handler is async
      Promise.resolve(handler(event)).catch(errHandler)
    } catch (e: unknown) {
      // In case it isn't
      errHandler(e)
    }
  }

  if (once) {
    eventEmitter.once(eventName, onHandler)
  } else {
    eventEmitter.on(eventName, onHandler)
  }

  return () => {
    eventEmitter.removeListener(eventName, onHandler)
  }
}
