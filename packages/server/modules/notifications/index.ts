import {
  initializeQueue,
  consumeIncomingNotifications,
  registerNotificationHandlers
} from '@/modules/notifications/services/queue'
import {
  NotificationType,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { Optional, SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { pick } from 'lodash'
import { Consumer } from 'redis-smq'
import { shutdownConsumer } from '@/modules/shared/helpers/redisSmqHelper'

let consumer: Optional<Consumer>

export async function initializeConsumption(typeWhitelist?: NotificationType[]) {
  const allHandlers: Partial<NotificationTypeHandlers> = {
    [NotificationType.MentionedInComment]: (
      await import('@/modules/notifications/services/handlers/mentionedInComment')
    ).default,
    [NotificationType.Test]: (
      await import('@/modules/notifications/services/handlers/test')
    ).default
  }

  registerNotificationHandlers(
    typeWhitelist?.length ? pick(allHandlers, typeWhitelist) : allHandlers
  )

  await initializeQueue()
  return await consumeIncomingNotifications()
}

export const init: SpeckleModule['init'] = async (_, isInitial) => {
  modulesDebug('📞 Init notifications module')

  if (isInitial) {
    consumer = await initializeConsumption()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  if (consumer) {
    await shutdownConsumer(consumer)
    consumer = undefined
  }
}
