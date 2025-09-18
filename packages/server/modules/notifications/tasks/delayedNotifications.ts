import { db } from '@/db/knex'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import type { Logger } from '@/observability/logging'
import {
  getNextEmailNotificationFactory,
  updateUserNotificationsFactory
} from '@/modules/notifications/repositories/userNotification'
import { NotificationType } from '@/modules/notifications/helpers/types'
import MentionedInCommentHandler from '@/modules/notifications/tasks/handlers/mentionedInComment'

type EmailNotificationResult = { notificationId: string } | null

const handleNextEmailNotification = async (deps: {
  logger: Logger
}): Promise<EmailNotificationResult> =>
  db.transaction(async (trx) => {
    const notification = await getNextEmailNotificationFactory({ db: trx })()
    if (!notification) return null

    try {
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
          break
      }
    } catch (error) {
      deps.logger.error(
        {
          error,
          type: notification.type,
          notificationId: notification.id
        },
        `Error handling notification. Skipping.`
      )
    }

    await updateUserNotificationsFactory({ db: trx })({
      ids: [notification.id],
      userId: notification.userId,
      update: {
        sendEmailAt: null,
        updatedAt: new Date()
      }
    })

    return { notificationId: notification.id }
  })

export const emitDelayedEmailNotifications = async (deps: { logger: Logger }) => {
  let result: EmailNotificationResult
  const MAX_ITERATIONS = 10_000
  let iterationCount = 0

  do {
    if (iterationCount++ >= MAX_ITERATIONS) {
      deps.logger.error(`Reached max iteration limit of ${MAX_ITERATIONS}.`)
      break
    }

    result = await handleNextEmailNotification(deps)
  } while (result)
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
        logger
      })
    }
  )
}
