import {
  NotificationsEvents,
  onNotificationsEvent
} from '@/modules/notifications/events/emitter'
import { NotificationMessage } from '@/modules/notifications/helpers/types'
import { NOTIFICATIONS_QUEUE } from '@/modules/notifications/services/queue'
import {
  baseConfig,
  createMessageManagerAsync
} from '@/modules/shared/helpers/redisSmqHelper'
import util from 'util'

/**
 * Purge pre-queued notifications
 */
export async function purgeNotifications() {
  const manager = await createMessageManagerAsync(baseConfig())
  const purge = util
    .promisify(manager.pendingMessages.purge)
    .bind(manager.pendingMessages)
  await purge(NOTIFICATIONS_QUEUE)
}

type AcknowledgementResult = {
  notification?: NotificationMessage
  err?: Error
  ack: boolean
}

/**
 * Wait for an acknowledged notification. Use optional predicate to filter
 * which notification you're looking for.
 */
export async function waitForAcknowledged(
  predicate?: (res: AcknowledgementResult) => boolean,
  timeout = 2000
) {
  let timeoutRef: NodeJS.Timer
  let stopListening: () => void

  return new Promise<AcknowledgementResult>((resolve, reject) => {
    stopListening = onNotificationsEvent(NotificationsEvents.Acknowledged, (event) => {
      if (!predicate) return resolve(event)
      if (predicate && predicate(event)) return resolve(event)
    })

    timeoutRef = setTimeout(() => {
      reject(new Error('Waiting for acknowledged notifications timed out'))
    }, timeout)
  }).finally(() => {
    clearTimeout(timeoutRef)
    stopListening?.()
  })
}
