import type {
  BaseUserNotification,
  UserNotificationRecord
} from '@/modules/notifications/helpers/types'
import { LatestNotificationVersions } from '@/modules/notifications/helpers/types'
import { logger } from '@/observability/logging'
import type { Nullable } from '@speckle/shared'

export const ensureNotificationToLatestVersion = (
  notification: BaseUserNotification
): Nullable<UserNotificationRecord> => {
  const latestVersion = LatestNotificationVersions[notification.type]

  if (notification.version === latestVersion) {
    return notification as UserNotificationRecord
  }

  logger.error(
    {
      notification,
      latestVersion
    },
    'No notification backward compatibility was configured'
  )
  return null
}

export const parseNotificationToLatestVersion = (
  notification: BaseUserNotification
): UserNotificationRecord => {
  const latestVersion = LatestNotificationVersions[notification.type]

  if (notification.version === latestVersion) {
    return notification as UserNotificationRecord
  }

  logger.warn(
    {
      notification,
      latestVersion
    },
    'No notification backward compatibility was configured'
  )
  return notification as UserNotificationRecord
}
