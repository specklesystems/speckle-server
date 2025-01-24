import { ModelEvents } from '@/modules/core/domain/branches/events'
import { ProjectModelsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import { BranchPubsubEvents } from '@/modules/shared'
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

const reportModelCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ModelEvents.Created>) => {
    const { model } = payload.payload

    await Promise.all([
      deps.publish(BranchPubsubEvents.BranchCreated, {
        branchCreated: { ...model },
        streamId: model.streamId
      }),
      deps.publish(ProjectSubscriptions.ProjectModelsUpdated, {
        projectId: model.streamId,
        projectModelsUpdated: {
          id: model.id,
          type: ProjectModelsUpdatedMessageType.Created,
          model
        }
      })
    ])
  }

const reportModelUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ModelEvents.Updated>) => {
    const { newModel, update } = payload.payload

    await Promise.all([
      deps.publish(BranchPubsubEvents.BranchUpdated, {
        branchUpdated: { ...update },
        streamId: newModel.streamId,
        branchId: newModel.id
      }),
      deps.publish(ProjectSubscriptions.ProjectModelsUpdated, {
        projectId: newModel.streamId,
        projectModelsUpdated: {
          model: newModel,
          id: newModel.id,
          type: ProjectModelsUpdatedMessageType.Updated
        }
      })
    ])
  }

const reportModelDeletedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ModelEvents.Deleted>) => {
    const { input, projectId } = payload.payload

    await Promise.all([
      deps.publish(BranchPubsubEvents.BranchDeleted, {
        branchDeleted: input,
        streamId: projectId
      }),
      deps.publish(ProjectSubscriptions.ProjectModelsUpdated, {
        projectId,
        projectModelsUpdated: {
          id: input.id,
          type: ProjectModelsUpdatedMessageType.Deleted,
          model: null
        }
      })
    ])
  }

export const reportSubscriptionEventsFactory =
  (
    deps: {
      eventListen: EventBusListen
      publish: PublishSubscription
    } & DependenciesOf<typeof reportModelCreatedFactory> &
      DependenciesOf<typeof reportModelUpdatedFactory> &
      DependenciesOf<typeof reportModelDeletedFactory>
  ) =>
  () => {
    const reportModelCreated = reportModelCreatedFactory(deps)
    const reportModelUpdated = reportModelUpdatedFactory(deps)
    const reportModelDeleted = reportModelDeletedFactory(deps)

    const quitCbs = [
      deps.eventListen(ModelEvents.Created, reportModelCreated),
      deps.eventListen(ModelEvents.Updated, reportModelUpdated),
      deps.eventListen(ModelEvents.Deleted, reportModelDeleted)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
