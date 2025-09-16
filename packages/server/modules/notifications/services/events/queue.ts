import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import type { Optional } from '@/modules/shared/helpers/typeHelper'
import { getRedisUrl, isProdEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import type Bull from 'bull'
import { initializeQueue as setupQueue } from '@speckle/shared/queue'
import { TIME_MS } from '@speckle/shared'
import type { NotificationEvents } from '@/modules/notifications/events/notificationListener'
import { notificationsLogger, Observability } from '@/observability/logging'
import { UnhandledNotificationError } from '@/modules/notifications/errors'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'
import MentionedInCommentHandler from '@/modules/notifications/services/events/handlers/mentionedInComment'
import { CommentEvents } from '@/modules/comments/domain/events'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'

export const NOTIFICATION_EVENTS_QUEUE = 'default:user-event-notifications'

let queue: Optional<Bull.Queue>

export const buildNotificationEventsQueue = async (queueName: string) =>
  await setupQueue({
    queueName,
    redisUrl: getRedisUrl(),
    options: {
      ...(!isTestEnv()
        ? {
            limiter: {
              max: 10,
              duration: TIME_MS.second
            }
          }
        : {}),
      defaultJobOptions: {
        attempts: 1,
        timeout: 10 * TIME_MS.second,
        removeOnComplete: isProdEnv(),
        removeOnFail: isProdEnv()
      }
    }
  })

export function getQueue(): Bull.Queue {
  if (!queue) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized Bull queue'
    )
  }

  return queue
}

export async function initializeNotificationEventsQueue() {
  queue = await buildNotificationEventsQueue(NOTIFICATION_EVENTS_QUEUE)
}

const handlers = {
  [CommentEvents.Created]: MentionedInCommentHandler,
  [CommentEvents.Updated]: MentionedInCommentHandler,
  [AccessRequestEvents.Created]: () => {},
  [AccessRequestEvents.Finalized]: () => {}
}

export async function consumeEventNotifications() {
  const queue = getQueue()

  void queue.process(async ({ data: event }: Bull.Job<NotificationEvents>) => {
    try {
      notificationsLogger.info('New notification received...')

      // Invoke correct handler
      const handler = handlers[event.eventName]
      if (!handler) throw new UnhandledNotificationError(null, { info: event })

      const notificationLogger = Observability.extendLoggerComponent(
        notificationsLogger,
        event.eventName
      )
      notificationLogger.info('Starting processing notification...')

      // TODO: type this
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await Promise.resolve(handler(event as unknown as any))

      notificationLogger.info('...successfully processed notification')
    } catch (e: unknown) {
      notificationsLogger.error(e)
      const err = ensureErrorOrWrapAsCause(
        e,
        'Unexpected notification consumption error'
      )

      throw err
    }
  })
}

/**
 * Publish message onto the notifications queue
 */
export async function publishEventMessage(message: NotificationEvents) {
  const queue = getQueue()
  const job = await queue.add(message)
  return job.id
}

export async function shutdownEventQueue() {
  if (!queue) return
  await queue.close()
}
