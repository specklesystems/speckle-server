import { CommentEvents } from '@/modules/comments/domain/events'
import { isNotificationListenerEnabled } from '@/modules/shared/helpers/envHelper'
import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { publishEventMessage } from '@/modules/notifications/services/events/queue'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import type { Logger } from '@/observability/logging'
import { markCommentNotificationsAsReadFactory } from '@/modules/notifications/repositories/userNotification'
import type { MarkCommentNotificationAsRead } from '@/modules/notifications/domain/operations'
import { db } from '@/db/knex'

export type NotificationEvents = EventPayload<
  | typeof CommentEvents.Created
  | typeof CommentEvents.Updated
  | typeof AccessRequestEvents.Created
  | typeof AccessRequestEvents.Finalized
>

const onEventTriggersNotificationFactory =
  ({ logger }: { logger: Logger }) =>
  async (event: NotificationEvents) => {
    if (!isNotificationListenerEnabled()) return

    logger.info('Notification triggered for event', event)

    await publishEventMessage(event)
  }

const onCommentViewedFactory =
  (deps: { markCommentNotificationsAsRead: MarkCommentNotificationAsRead }) =>
  async (event: EventPayload<typeof CommentEvents.Viewed>) => {
    if (!isNotificationListenerEnabled()) return

    await deps.markCommentNotificationsAsRead(event.payload)
  }

export const notificationListenersFactory =
  (deps: { eventBus: EventBus; logger: Logger }) => () => {
    const onEventTriggersNotification = onEventTriggersNotificationFactory({
      logger: deps.logger
    })

    const onCommentViewed = onCommentViewedFactory({
      markCommentNotificationsAsRead: markCommentNotificationsAsReadFactory({ db })
    })

    const cbs = [
      deps.eventBus.listen(CommentEvents.Created, onEventTriggersNotification),
      deps.eventBus.listen(CommentEvents.Updated, onEventTriggersNotification),
      deps.eventBus.listen(AccessRequestEvents.Created, onEventTriggersNotification),
      deps.eventBus.listen(AccessRequestEvents.Finalized, onEventTriggersNotification),
      deps.eventBus.listen(CommentEvents.Viewed, onCommentViewed)
    ]

    return () => cbs.forEach((cb) => cb())
  }
