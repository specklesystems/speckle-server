import {
  NotificationsEventPayloadMap,
  NotificationsEvents,
  onNotificationsEvent
} from '@/modules/notifications/events/emitter'
import { NOTIFICATIONS_QUEUE } from '@/modules/notifications/services/queue'
import {
  baseConfig,
  createMessageManagerAsync
} from '@/modules/shared/helpers/redisSmqHelper'
import { EventEmitter } from 'events'
import util from 'util'
import { TGetMessagesReply } from 'redis-smq/dist/types'

type AckEvent = NotificationsEventPayloadMap[NotificationsEvents.Acknowledged]

export async function buildNotificationsStateTracker() {
  const collectedAcks = new Map<string, AckEvent>()

  const localEvents = new EventEmitter()
  const newAckEvent = 'NEW_ACK'

  const stopListening = onNotificationsEvent(
    NotificationsEvents.Acknowledged,
    (event) => {
      // Set inside collected acks
      collectedAcks.set(event.msgId, event)

      // Emit event to waitForAck promise handlers
      localEvents.emit(newAckEvent, event)
      console.log(newAckEvent, event)
    }
  )

  return {
    /**
     * Quit listening for notification acknowledgements
     */
    destroy: () => {
      stopListening()
      localEvents.removeAllListeners()
    },

    /**
     * Reset/clear collected data
     */
    reset: () => {
      collectedAcks.clear()
    },

    /**
     * Wait for an acknowledgement of a specific msg
     */
    waitForMsgAck: async (msgId: string, timeout = 10000) => {
      // Create promise for waiting for ack. Creating it first, so that we don't run into
      // a situation where an ack occurred between the "Do we have it already?" check
      // and the promise actually being initialized
      let timeoutRef: NodeJS.Timer
      let eventEmitterHandler: (e: AckEvent) => void
      const waitPromise = new Promise<AckEvent>((resolve, reject) => {
        // Set ack cb for notifications event handler
        eventEmitterHandler = (e) => {
          console.log('test: ', msgId, e)
          if (e.msgId === msgId) return resolve(e)
        }
        localEvents.on(newAckEvent, eventEmitterHandler)

        // Set timeout
        timeoutRef = setTimeout(
          () => reject(new Error('Waiting for notification ack timed out')),
          timeout
        )
      }).finally(() => {
        clearTimeout(timeoutRef)
        localEvents.off(newAckEvent, eventEmitterHandler)
      })

      // Do we have it already?
      const event = collectedAcks.get(msgId)
      if (event) return event

      // Not available - return promise
      return waitPromise
    },

    /**
     * Wait for an acknowledgement without knowing the msg id
     */
    waitForAck: async (predicate?: (e: AckEvent) => boolean, timeout = 10000) => {
      let timeoutRef: NodeJS.Timer
      let eventEmitterHandler: (e: AckEvent) => void
      return new Promise<AckEvent>((resolve, reject) => {
        // Set ack cb for notifications event handler
        eventEmitterHandler = (e) => {
          console.log('testX: ', e)
          if (!predicate) return resolve(e)
          if (predicate && predicate(e)) return resolve(e)
        }
        localEvents.on(newAckEvent, eventEmitterHandler)

        // Set timeout
        timeoutRef = setTimeout(
          () => reject(new Error('Waiting for notification ack timed out')),
          timeout
        )
      }).finally(() => {
        clearTimeout(timeoutRef)
        localEvents.off(newAckEvent, eventEmitterHandler)
      })
    }
  }
}

export type NotificationsStateManager = Awaited<
  ReturnType<typeof buildNotificationsStateTracker>
>

/**
 * Purge pre-queued notifications
 */
export async function purgeNotifications() {
  const manager = await createMessageManagerAsync(baseConfig())

  const list = await new Promise<TGetMessagesReply | undefined>((resolve, reject) => {
    manager.pendingMessages.list(NOTIFICATIONS_QUEUE, 0, 100, (err, reply) => {
      if (err) return reject(err)
      resolve(reply)
    })
  })
  console.log(list)

  const purge = util
    .promisify(manager.pendingMessages.purge)
    .bind(manager.pendingMessages)
  await purge(NOTIFICATIONS_QUEUE)
}
