import { UninitializedResourceAccessError } from '@/modules/shared/errors'
import {
  baseConfig,
  createAndInitProducer,
  createQueueAsync,
  createQueueManagerAsync,
  produceMessageAsync,
  setRateLimit,
  startConsumption
} from '@/modules/shared/helpers/redisSmqHelper'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { Message, Producer, QueueManager } from 'redis-smq'
import { QueueExistsError } from 'redis-smq/dist/src/lib/queue-manager/errors/queue-exists.error'
import {
  InvalidNotificationError,
  NotificationValidationError,
  UnhandledNotificationError
} from '@/modules/notifications/errors'
import {
  isNotificationMessage,
  NotificationHandler,
  NotificationType,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import { notificationsDebug } from '@/modules/shared/utils/logger'
import {
  emitNotificationsEvent,
  NotificationsEvents
} from '@/modules/notifications/events/emitter'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { TQueueParams } from 'redis-smq/dist/types'

enum QueueNamespace {
  Default = 'default',
  Test = 'test'
}

function getNamespace(): QueueNamespace {
  return isTestEnv() ? QueueNamespace.Test : QueueNamespace.Default
}

let producer: Optional<Producer>
let queueManager: Optional<QueueManager>

const handlers = new Map<NotificationType, NotificationHandler>()

export const NOTIFICATIONS_QUEUE: TQueueParams = {
  name: 'user-notifications',
  ns: getNamespace()
}

function getProducer(): Producer {
  if (!producer) {
    throw new UninitializedResourceAccessError(
      'Attempting to use uninitialized redis-smq producer'
    )
  }

  return producer
}

/**
 * Initialize notifications queue
 */
export async function initializeQueue() {
  queueManager = await createQueueManagerAsync(baseConfig())

  // Ensure queue exists
  try {
    await createQueueAsync(queueManager, NOTIFICATIONS_QUEUE)
  } catch (e: unknown) {
    if (!(e instanceof QueueExistsError)) {
      throw e
    }
  }

  // Set rate limit so that we don't overwhelm the consumer - 10 msg/s
  if (!isTestEnv()) {
    await setRateLimit(queueManager, NOTIFICATIONS_QUEUE, {
      limit: 10,
      interval: 1000
    })
  }

  producer = await createAndInitProducer()
}

/**
 * Publish message onto the notifications queue
 */
export async function publishMessage(message: Message) {
  const producer = getProducer()
  message.setQueue(NOTIFICATIONS_QUEUE)

  return await produceMessageAsync(producer, message)
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
  return await startConsumption(NOTIFICATIONS_QUEUE, async (msg, ack) => {
    try {
      notificationsDebug('New notification received...')

      // Parse
      const msgString = msg.getBody() as string
      const payload = JSON.parse(msgString)
      const typedPayload = isNotificationMessage(payload) ? payload : undefined
      if (!typedPayload) {
        throw new InvalidNotificationError('Received an invalid notification', {
          info: {
            payload
          }
        })
      }
      emitNotificationsEvent(NotificationsEvents.Consumed, {
        notification: typedPayload
      })

      // Invoke correct handler
      const type = typedPayload.type
      const handler = handlers.get(type)
      if (!handler) {
        throw new UnhandledNotificationError(null, { info: { payload, type } })
      }

      const notificationDebug = notificationsDebug.extend(type)
      notificationDebug('Starting processing notification...')
      await Promise.resolve(
        handler(typedPayload, { wrapperMessage: msg, debug: notificationDebug })
      )

      ack()
      emitNotificationsEvent(NotificationsEvents.Acknowledged, {
        notification: typedPayload,
        ack: true
      })
      notificationDebug('...successfully processed notification')
    } catch (e: unknown) {
      notificationsDebug(e)
      const err =
        e instanceof Error ? e : new Error('Unexpected notification consumption error')

      let isAcked = false
      if (err instanceof NotificationValidationError) {
        ack()
        isAcked = true
      } else {
        ack(err)
      }

      emitNotificationsEvent(NotificationsEvents.Acknowledged, {
        err,
        ack: isAcked
      })
    }
  })
}
