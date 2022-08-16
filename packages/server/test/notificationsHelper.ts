import {
  NotificationsEventPayloadMap,
  NotificationsEvents,
  onNotificationsEvent
} from '@/modules/notifications/events/emitter'
import { EventEmitter } from 'events'

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
    }
  )

  return {
    /**
     * Quit listening for notification acknowledgements
     */
    quit: () => {
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
    waitForMsgAck: async (msgId: string, timeout = 2000) => {
      // Create promise for waiting for ack. Creating it first, so that we don't run into
      // a situation where an ack occurred between the "Do we have it already?" check
      // and the promise actually being initialized
      let timeoutRef: NodeJS.Timer
      let eventEmitterHandler: (e: AckEvent) => void
      const waitPromise = new Promise<AckEvent>((resolve, reject) => {
        // Set ack cb for notifications event handler
        eventEmitterHandler = (e) => {
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
    waitForAck: async (predicate?: (e: AckEvent) => boolean, timeout = 2000) => {
      let timeoutRef: NodeJS.Timer
      let eventEmitterHandler: (e: AckEvent) => void
      return new Promise<AckEvent>((resolve, reject) => {
        // Set ack cb for notifications event handler
        eventEmitterHandler = (e) => {
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
