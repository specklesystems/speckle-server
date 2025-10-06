import { db } from '@/db/knex'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { scheduleExecutionFactory } from '@/modules/core/services/taskScheduler'
import type { Logger } from '@/observability/logging'
import {
  getNextEmailNotificationFactory,
  updateUserNotificationFactory
} from '@/modules/notifications/repositories/userNotification'
import { NotificationType } from '@speckle/shared/notifications'
import MentionedInCommentHandler from '@/modules/notifications/tasks/handlers/mentionedInComment'
import StreamAccessRequestApprovedHandler from '@/modules/notifications/tasks/handlers/streamAccessRequestApproved'
import NewStreamAccessRequestHandler from '@/modules/notifications/tasks/handlers/newStreamAccessRequest'
import { ensureNotificationToLatestVersion } from '@/modules/notifications/helpers/toLatestVersion'
import { throwUncoveredError } from '@speckle/shared'

type EmailNotificationResult = { notificationId: string } | null

const handleNextEmailNotification = async (deps: {
  logger: Logger
}): Promise<EmailNotificationResult> =>
  db.transaction(async (trx) => {
    const baseNotification = await getNextEmailNotificationFactory({ db: trx })()
    if (!baseNotification) return null

    const notification = ensureNotificationToLatestVersion(baseNotification)
    if (!notification) return null

    try {
      switch (notification.type) {
        case NotificationType.MentionedInComment:
          await MentionedInCommentHandler(notification)
          break
        case NotificationType.StreamAccessRequestApproved:
          await StreamAccessRequestApprovedHandler(notification)
          break
        case NotificationType.NewStreamAccessRequest:
          await NewStreamAccessRequestHandler(notification)
          break
        default:
          throwUncoveredError(notification)
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

    await updateUserNotificationFactory({ db: trx })({
      id: notification.id,
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
