import { AccSyncItemEvents } from '@/modules/acc/domain/acc/events'
import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import type { PublishSubscription } from '@/modules/shared/utils/subscriptions'
import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'

export const reportAccSyncItemCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof AccSyncItemEvents.Created>) => {
    const { projectId, syncItem } = payload.payload

    await deps.publish(ProjectSubscriptions.ProjectAccSyncItemUpdated, {
      projectId,
      projectAccSyncItemsUpdated: {
        type: 'CREATED',
        id: syncItem.id,
        accSyncItem: syncItem
      }
    })
  }

export const reportAccSyncItemUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof AccSyncItemEvents.Updated>) => {
    const { projectId, newSyncItem } = payload.payload

    await deps.publish(ProjectSubscriptions.ProjectAccSyncItemUpdated, {
      projectId,
      projectAccSyncItemsUpdated: {
        type: 'UPDATED',
        id: newSyncItem.id,
        accSyncItem: newSyncItem
      }
    })
  }

export const reportAccSyncItemDeletedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof AccSyncItemEvents.Deleted>) => {
    const { projectId, id } = payload.payload

    await deps.publish(ProjectSubscriptions.ProjectAccSyncItemUpdated, {
      projectId,
      projectAccSyncItemsUpdated: {
        type: 'DELETED',
        id,
        accSyncItem: null
      }
    })
  }

export const reportSubscriptionEventsFactory =
  (deps: { eventListen: EventBusListen; publish: PublishSubscription }) => () => {
    const reportItemCreated = reportAccSyncItemCreatedFactory(deps)
    const reportItemUpdated = reportAccSyncItemUpdatedFactory(deps)
    const reportItemDeleted = reportAccSyncItemDeletedFactory(deps)

    const quitCbs = [
      deps.eventListen(AccSyncItemEvents.Created, reportItemCreated),
      deps.eventListen(AccSyncItemEvents.Updated, reportItemUpdated),
      deps.eventListen(AccSyncItemEvents.Deleted, reportItemDeleted)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
