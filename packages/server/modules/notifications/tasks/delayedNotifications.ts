import { db } from '@/db/knex'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import type { Logger } from '@/observability/logging'
import type {
  GetEmailNotifications,
  UpdateUserNotifications
} from '@/modules/notifications/domain/operations'
import {
  getEmailNotificationsFactory,
  updateUserNotificationsFactory
} from '@/modules/notifications/repositories/userNotification'
import { NotificationType } from '@/modules/notifications/helpers/types'
import MentionedInCommentHandler from '@/modules/notifications/tasks/handlers/mentionedInComment'

export const emitDelayedEmailNotifications = async (deps: {
  logger: Logger
  getEmailNotifications: GetEmailNotifications
  updateUserNotifications: UpdateUserNotifications
}) => {
  // tx per one notification
  const notifications = await deps.getEmailNotifications()
  if (!notifications.length) return

  for (const notification of notifications) {
    switch (notification.type) {
      case NotificationType.MentionedInComment:
        await MentionedInCommentHandler(notification)
        break
      default:
        deps.logger.error(
          {
            type: notification.type,
            notificationId: notification.id
          },
          `No handler scheduled notification type. Skipping.`
        )
        return
    }

    await deps.updateUserNotifications({
      ids: [notification.id],
      userId: notification.userId,
      update: {
        sendEmailAt: null,
        updatedAt: new Date()
      }
    })
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
        updateUserNotifications: updateUserNotificationsFactory({ db })
      })
    }
  )
}
