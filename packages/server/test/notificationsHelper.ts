import { logger } from '@/logging/logging'
import { getQueue, NotificationJobResult } from '@/modules/notifications/services/queue'
import { EventEmitter } from 'events'
import { CompletedEventCallback, FailedEventCallback, JobId } from 'bull'
import { pick } from 'lodash'
import { Nullable } from '@speckle/shared'

type AckEvent = {
  result?: NotificationJobResult
  err?: Error
  jobId: JobId
}

const NEW_ACK_EVENT = 'new-ack'

export function buildNotificationsStateTracker() {
  const queue = getQueue()
  const localEvents = new EventEmitter()

  const ackHandler = (e: AckEvent) => {
    collectedAcks.set(e.jobId, e)

    // Emit event to waitForAck promise handlers
    localEvents.emit(NEW_ACK_EVENT, e)
  }

  const completedHandler: CompletedEventCallback = (job, result) => {
    ackHandler({ result, jobId: job.id })
  }
  const failedHandler: FailedEventCallback = (job, err) => {
    ackHandler({ err, jobId: job.id })
  }

  queue.on('completed', completedHandler)
  queue.on('failed', failedHandler)

  const collectedAcks = new Map<JobId, AckEvent>()

  return {
    /**
     * Quit listening for notification acknowledgements
     */
    destroy: () => {
      queue.removeListener('completed', completedHandler)
      queue.removeListener('failed', failedHandler)
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
    waitForMsgAck: async (msgId: JobId, timeout = 2000) => {
      let timeoutRef: NodeJS.Timer
      let eventEmitterHandler: (e: AckEvent) => void
      return new Promise<AckEvent>((resolve, reject) => {
        // Set ack cb for notifications event handler
        eventEmitterHandler = (e) => {
          if (e.jobId === msgId) return resolve(e)
        }
        localEvents.on(NEW_ACK_EVENT, eventEmitterHandler)

        // Do we have it already?
        const event = collectedAcks.get(msgId)
        if (event) {
          return resolve(event)
        }

        // Set timeout
        timeoutRef = setTimeout(
          () => reject(new Error('Waiting for notification ack timed out')),
          timeout
        )
      }).finally(() => {
        clearTimeout(timeoutRef)
        localEvents.off(NEW_ACK_EVENT, eventEmitterHandler)
      })
    },

    /**
     * Wait for an acknowledgement without knowing the msg id.
     * IMPORTANT NOTE: Create the promise before the operation that creates the message and await it after,
     * otherwise it might get processed so fast that you miss it
     */
    waitForAck: async (predicate?: (e: AckEvent) => boolean, timeout = 3000) => {
      let timeoutRef: NodeJS.Timer
      let promiseAckTracker: (e: AckEvent) => void

      // We start tracking even before promise is created so that we can't possibly miss it
      let foundAck: Nullable<AckEvent> = null
      const ackTracker = (e: AckEvent) => {
        if (predicate) {
          if (predicate(e)) foundAck = e
        } else {
          foundAck = e
        }
      }
      localEvents.on(NEW_ACK_EVENT, ackTracker)

      return new Promise<AckEvent>((resolve, reject) => {
        // Resolve/reject promise based on acks arriving
        promiseAckTracker = (e) => {
          if (!predicate) return resolve(e)
          if (predicate && predicate(e)) return resolve(e)
        }
        localEvents.on(NEW_ACK_EVENT, promiseAckTracker)

        // Now that we have the promise tracker in place, its safe to check if ack is
        // possibly already found and unsubscribe ackTracker
        localEvents.off(NEW_ACK_EVENT, ackTracker)
        if (foundAck) {
          return resolve(foundAck)
        }

        // Set timeout
        timeoutRef = setTimeout(
          () => reject(new Error('Waiting for notification ack timed out')),
          timeout
        )
      }).finally(() => {
        clearTimeout(timeoutRef)
        localEvents.off(NEW_ACK_EVENT, ackTracker)
        localEvents.off(NEW_ACK_EVENT, promiseAckTracker)
      })
    }
  }
}

export type NotificationsStateManager = ReturnType<
  typeof buildNotificationsStateTracker
>

/**
 * Purge pre-queued notifications
 */
export async function purgeNotifications() {
  const queue = getQueue()
  await queue.empty()
}

/**
 * Get current state of the notifications queue & workers
 */
export async function debugJobs() {
  const queue = getQueue()
  const [waiting, active, delayed, completed, failed, workers] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getDelayed(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getWorkers()
  ])

  const jobCollections = [
    { items: waiting, display: 'Waiting' },
    { items: active, display: 'Active' },
    { items: delayed, display: 'Delayed' },
    { items: completed, display: 'Completed' },
    { items: failed, display: 'Failed' }
  ]

  logger.debug('------------- START debugJobs() --------------')

  for (const { items, display } of jobCollections) {
    logger.debug(`${display}: ` + waiting.length)
    logger.debug(`${display} jobs: `)
    for (const job of items) {
      logger.debug(
        ` - ${JSON.stringify(
          pick(job, [
            'timestamp',
            'returnvalue',
            'id',
            'processedOn',
            'finishedOn',
            'failedReason'
          ])
        )}`
      )
    }
  }
  logger.debug({ workers })
  logger.debug('------------- END debugJobs() --------------')
}
