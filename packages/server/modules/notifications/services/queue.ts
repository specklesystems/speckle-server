import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import {
  InvalidNotificationError,
  NotificationValidationError,
  UnhandledNotificationError
} from '@/modules/notifications/errors'
import {
  isNotificationMessage,
  NotificationHandler,
  NotificationMessage,
  NotificationType,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import { isProdEnv, isTestEnv } from '@/modules/shared/helpers/envHelper'
import Bull from 'bull'
import { buildBaseQueueOptions } from '@/modules/shared/helpers/bullHelper'
import cryptoRandomString from 'crypto-random-string'
import { logger, notificationsLogger, Observability } from '@/logging/logging'
import { ensureErrorOrWrapAsCause } from '@/modules/shared/errors/ensureError'

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

export const buildNotificationsQueue = (queueName: string) =>
  new Bull(queueName, {
    ...buildBaseQueueOptions(),
    ...(!isTestEnv()
      ? {
          limiter: {
            max: 10,
            duration: 1000
          }
        }
      : {}),
    defaultJobOptions: {
      attempts: 1,
      timeout: 10 * 1000, // 10s execution timeout
      removeOnComplete: isProdEnv(),
      removeOnFail: isProdEnv()
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
export function initializeQueue() {
  queue = buildNotificationsQueue(NOTIFICATIONS_QUEUE)
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
  queue.process(async (job): Promise<NotificationJobResult> => {
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

export async function shutdownQueue() {
  if (!queue) return
  await queue.close()
}
