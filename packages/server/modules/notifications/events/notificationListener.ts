import { CommentEvents } from '@/modules/comments/domain/events'
import { isNotificationListenerEnabled } from '@/modules/shared/helpers/envHelper'
import type { EventBus, EventPayload } from '@/modules/shared/services/eventBus'
import { publishEventMessage } from '@/modules/notifications/services/eventQueue'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import type { Logger } from '@/observability/logging'

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

export const notificationListenersFactory =
  (deps: { eventBus: EventBus; logger: Logger }) => () => {
    const onEventTriggersNotification = onEventTriggersNotificationFactory({
      logger: deps.logger
    })

    const cbs = [
      // TODO: better way?
      deps.eventBus.listen(CommentEvents.Created, onEventTriggersNotification), // TODO: change to mentioned?
      deps.eventBus.listen(CommentEvents.Updated, onEventTriggersNotification),
      deps.eventBus.listen(AccessRequestEvents.Created, onEventTriggersNotification),
      deps.eventBus.listen(AccessRequestEvents.Finalized, onEventTriggersNotification)
    ]

    return () => cbs.forEach((cb) => cb())
  }
