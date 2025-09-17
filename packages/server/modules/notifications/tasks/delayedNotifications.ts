import { db } from '@/db/knex'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import type { Logger } from '@/observability/logging'
import type {
  GetEmailNotifications,
  UpdateUserNotification
} from '@/modules/notifications/domain/operations'
import {
  getEmailNotificationsFactory,
  updateUserNotificationFactory
} from '@/modules/notifications/repositories/userNotification'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@/modules/notifications/helpers/types'
import MentionedInCommentHandler from '@/modules/notifications/tasks/handlers/mentionedInComment'

type NotificationHandlerMap = {
  [T in NotificationType]: (notification: UserNotificationRecord<T>) => Promise<void>
}

const emailNotificationHandlers: Partial<NotificationHandlerMap> = {
  [NotificationType.MentionedInComment]: MentionedInCommentHandler
}

export const emitDelayedEmailNotifications = async (deps: {
  logger: Logger
  getEmailNotifications: GetEmailNotifications
  updateUserNotification: UpdateUserNotification
}) => {
  const notifications = await deps.getEmailNotifications()
  if (!notifications.length) return

  for (const notification of notifications) {
    const handler = emailNotificationHandlers[notification.type] as
      | ((n: typeof notification) => Promise<void>) // TODO: improve typing here
      | undefined

    if (!handler) {
      deps.logger.error(
        {
          type: notification.type,
          notificationId: notification.id
        },
        `No handler scheduled notification type. Skipping.`
      )
      return
    }

    try {
      await handler(notification)
    } catch (error) {
      deps.logger.error(
        {
          type: notification.type,
          notificationId: notification.id,
          error
        },
        `Error emitting notification. Skipping.`
      )
    }

    await deps.updateUserNotification(notification.id, { sendEmailAt: null })
    continue
  }
}

export const scheduleDelayedEmailNotifications = async () => {
  const scheduleExecution = scheduleExecutionFactory({
    acquireTaskLock: acquireTaskLockFactory({ db }),
    releaseTaskLock: releaseTaskLockFactory({ db })
  })

  const everyMin = '*/1 * * * *'
  return scheduleExecution(
    everyMin,
    'DelayedEmailNotifications',
    async (_scheduledTime, { logger }) => {
      await emitDelayedEmailNotifications({
        logger,
        getEmailNotifications: getEmailNotificationsFactory({ db }),
        updateUserNotification: updateUserNotificationFactory({ db })
      })
    }
  )
}
