import { getQueue, NotificationJobResult } from '@/modules/notifications/services/queue'
import { EventEmitter } from 'events'
import { CompletedEventCallback, FailedEventCallback, JobId } from 'bull'
import { pick } from 'lodash'
import { Logger } from '@/logging/logging'

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
        localEvents.on(NEW_ACK_EVENT, eventEmitterHandler)

        // Set timeout
        timeoutRef = setTimeout(
          () => reject(new Error('Waiting for notification ack timed out')),
          timeout
        )
      }).finally(() => {
        clearTimeout(timeoutRef)
        localEvents.off(NEW_ACK_EVENT, eventEmitterHandler)
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

  Logger.debug('------------- START debugJobs() --------------')

  for (const { items, display } of jobCollections) {
    Logger.debug(`${display}: ` + waiting.length)
    Logger.debug(`${display} jobs: `)
    for (const job of items) {
      Logger.debug(
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
  Logger.debug({ workers })
  Logger.debug('------------- END debugJobs() --------------')
}
