import { ProjectSavedViewsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import type { DependenciesOf } from '@/modules/shared/helpers/factory'
import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  SavedViewSubscriptions,
  type PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import { SavedViewsEvents } from '@/modules/viewer/domain/events/savedViews'

const reportSavedViewCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.Created>) => {
    const { savedView } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewsUpdated, {
      projectSavedViewsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Created,
        projectId: savedView.projectId,
        savedView,
        id: savedView.id
      }
    })
  }

const reportSavedViewUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.Updated>) => {
    const { savedView } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewsUpdated, {
      projectSavedViewsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Updated,
        projectId: savedView.projectId,
        savedView,
        id: savedView.id
      }
    })
  }

const reportSavedViewDeletedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.Deleted>) => {
    const { savedView } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewsUpdated, {
      projectSavedViewsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Deleted,
        projectId: savedView.projectId,
        savedView: null,
        id: savedView.id
      }
    })
  }

const reportSavedViewGroupCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.GroupCreated>) => {
    const { savedViewGroup } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewGroupsUpdated, {
      projectSavedViewGroupsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Created,
        projectId: savedViewGroup.projectId,
        savedViewGroup,
        id: savedViewGroup.id
      }
    })
  }

const reportSavedViewGroupUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.GroupUpdated>) => {
    const { savedViewGroup } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewGroupsUpdated, {
      projectSavedViewGroupsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Updated,
        projectId: savedViewGroup.projectId,
        savedViewGroup,
        id: savedViewGroup.id
      }
    })
  }

const reportSavedViewGroupDeletedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof SavedViewsEvents.GroupDeleted>) => {
    const { savedViewGroup } = payload.payload

    await deps.publish(SavedViewSubscriptions.ProjectSavedViewGroupsUpdated, {
      projectSavedViewGroupsUpdated: {
        type: ProjectSavedViewsUpdatedMessageType.Deleted,
        projectId: savedViewGroup.projectId,
        savedViewGroup: null,
        id: savedViewGroup.id
      }
    })
  }

export const reportSubscriptionEventsFactory =
  (
    deps: { listen: EventBusListen; publish: PublishSubscription } & DependenciesOf<
      typeof reportSavedViewCreatedFactory
    > &
      DependenciesOf<typeof reportSavedViewUpdatedFactory> &
      DependenciesOf<typeof reportSavedViewDeletedFactory> &
      DependenciesOf<typeof reportSavedViewGroupCreatedFactory> &
      DependenciesOf<typeof reportSavedViewGroupUpdatedFactory> &
      DependenciesOf<typeof reportSavedViewGroupDeletedFactory>
  ) =>
  () => {
    const reportSavedViewCreated = reportSavedViewCreatedFactory(deps)
    const reportSavedViewUpdated = reportSavedViewUpdatedFactory(deps)
    const reportSavedViewDeleted = reportSavedViewDeletedFactory(deps)
    const reportSavedViewGroupCreated = reportSavedViewGroupCreatedFactory(deps)
    const reportSavedViewGroupUpdated = reportSavedViewGroupUpdatedFactory(deps)
    const reportSavedViewGroupDeleted = reportSavedViewGroupDeletedFactory(deps)

    const quitters = [
      deps.listen(SavedViewsEvents.Created, reportSavedViewCreated),
      deps.listen(SavedViewsEvents.Updated, reportSavedViewUpdated),
      deps.listen(SavedViewsEvents.Deleted, reportSavedViewDeleted),
      deps.listen(SavedViewsEvents.GroupCreated, reportSavedViewGroupCreated),
      deps.listen(SavedViewsEvents.GroupUpdated, reportSavedViewGroupUpdated),
      deps.listen(SavedViewsEvents.GroupDeleted, reportSavedViewGroupDeleted)
    ]

    return () => {
      quitters.forEach((quit) => quit())
    }
  }
