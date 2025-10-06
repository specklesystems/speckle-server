import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import type { Optional } from '@/modules/shared/helpers/typeHelper'
import {
  InvalidNotificationError,
  NotificationValidationError,
  UnhandledNotificationError
} from '@/modules/notifications/errors'
import type {
  NotificationHandler,
  NotificationMessage,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import { isNotificationMessage } from '@/modules/notifications/helpers/types'
import { getRedisUrl, isProdEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import type Bull from 'bull'
import { initializeQueue as setupQueue } from '@speckle/shared/queue'
import cryptoRandomString from 'crypto-random-string'
import { logger, notificationsLogger, Observability } from '@/observability/logging'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'
import { TIME_MS } from '@speckle/shared'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { NotificationsEvents } from '@/modules/notifications/domain/events'
import type { NotificationType } from '@speckle/shared/notifications'

export type NotificationJobResult = {
  status: NotificationJobResultsStatus
  type: NotificationType | undefined
}

export enum NotificationJobResultsStatus {
  Success = 'success',
  ValidationError = 'validation-error'
}

const handlers = new Map<NotificationType, NotificationHandler>()

const NOTIFICATIONS_QUEUE_MAIN_BASE = `default:user-notifications`
const NOTIFICATIONS_QUEUE_TEST_BASE = `test:user-notifications`
const PROCESS_ID = cryptoRandomString({ length: 5 })

export const NOTIFICATIONS_QUEUE = isTestEnv()
  ? `${NOTIFICATIONS_QUEUE_TEST_BASE}:${PROCESS_ID}`
  : NOTIFICATIONS_QUEUE_MAIN_BASE

if (isTestEnv()) {
  logger.info('Notifications test queue ID: ' + NOTIFICATIONS_QUEUE)
  logger.info(`Monitor using: 'yarn cli bull monitor ${NOTIFICATIONS_QUEUE}'`)
}

let queue: Optional<Bull.Queue>

export const buildNotificationsQueue = async (queueName: string) =>
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

/**
 * Get queue, if it's been initialized
 */
export function getQueue(): Bull.Queue {
  if (!queue) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized Bull queue'
    )
  }

  return queue
}

/**
 * Initialize notifications queue
 */
export async function initializePublicationQueue() {
  queue = await buildNotificationsQueue(NOTIFICATIONS_QUEUE)
}

/**
 * Publish message onto the notifications queue
 */
export async function publishMessage(message: NotificationMessage) {
  const queue = getQueue()
  const job = await queue.add(message)
  return job.id
}

/**
 * Register notification message handlers for various notification types.
 *
 * The param is typed so that you can't add mismatch notification types to the wrong handlers.
 * To adjust which NotificationType values are mapped to which messages and handlers
 * see NotificationTypeMessageMap.
 */
export function registerNotificationHandlers(
  newHandlers: Partial<NotificationTypeHandlers>
) {
  for (const [type, handler] of Object.entries(newHandlers)) {
    handlers.set(type as NotificationType, handler)
  }
}

/**
 * Start consuming incoming notifications off the queue
 * @returns Producer, that you can use to cancel consumption
 */
export async function consumeIncomingNotifications() {
  const queue = getQueue()
  const eventBus = getEventBus()

  void queue.process(async (job): Promise<NotificationJobResult> => {
    let notificationType: Optional<NotificationType>
    try {
      notificationsLogger.info('New notification received...')

      // Parse
      const payload = job.data as unknown
      const typedPayload = isNotificationMessage(payload) ? payload : undefined
      if (!typedPayload) {
        throw new InvalidNotificationError('Received an invalid notification', {
          info: {
            payload
          }
        })
      }

      // Invoke correct handler
      const type = typedPayload.type as NotificationType
      notificationType = type

      await eventBus.emit({
        eventName: NotificationsEvents.Received,
        payload: {
          message: typedPayload
        }
      })

      const handler = handlers.get(type)
      if (!handler) {
        throw new UnhandledNotificationError(null, { info: { payload, type } })
      }

      const notificationLogger = Observability.extendLoggerComponent(
        notificationsLogger,
        type
      )
      notificationLogger.info('Starting processing notification...')
      await Promise.resolve(handler(typedPayload, { job, logger: notificationLogger }))
      notificationLogger.info('...successfully processed notification')

      return {
        status: NotificationJobResultsStatus.Success,
        type
      }
    } catch (e: unknown) {
      notificationsLogger.error(e)
      const err = ensureErrorOrWrapAsCause(
        e,
        'Unexpected notification consumption error'
      )

      if (!(err instanceof NotificationValidationError)) {
        throw err
      }

      return {
        status: NotificationJobResultsStatus.ValidationError,
        type: notificationType
      }
    }
  })
}

export async function shutdownPublicationQueue() {
  if (!queue) return
  await queue.close()
}
