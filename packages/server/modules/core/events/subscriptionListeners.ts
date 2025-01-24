import { ModelEvents } from '@/modules/core/domain/branches/events'
import { VersionEvents } from '@/modules/core/domain/commits/events'
import {
  CommitUpdateInput,
  ProjectModelsUpdatedMessageType,
  ProjectVersionsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { isOldVersionUpdateInput } from '@/modules/core/services/commit/management'
import { BranchPubsubEvents, CommitPubsubEvents } from '@/modules/shared'
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

const reportVersionMovedModelFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof VersionEvents.MovedModel>) => {
    const { version, projectId, newModelId } = payload.payload

    await deps.publish(ProjectSubscriptions.ProjectVersionsUpdated, {
      projectId,
      projectVersionsUpdated: {
        id: version.id,
        version: { ...version, streamId: projectId },
        type: ProjectVersionsUpdatedMessageType.Updated,
        modelId: newModelId
      }
    })
  }

const reportVersionDeletedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof VersionEvents.Deleted>) => {
    const { version, projectId, modelId } = payload.payload

    await Promise.all([
      deps.publish(CommitPubsubEvents.CommitDeleted, {
        commitDeleted: {
          ...version,
          streamId: projectId,
          branchId: modelId
        },
        streamId: projectId
      }),
      deps.publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId,
        projectVersionsUpdated: {
          id: version.id,
          type: ProjectVersionsUpdatedMessageType.Deleted,
          version: null,
          modelId
        }
      })
    ])
  }

const reportVersionCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof VersionEvents.Created>) => {
    const { version, projectId, modelId, input, userId } = payload.payload

    await Promise.all([
      deps.publish(CommitPubsubEvents.CommitCreated, {
        commitCreated: { ...input, id: version.id, authorId: userId },
        streamId: projectId
      }),
      deps.publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId,
        projectVersionsUpdated: {
          id: version.id,
          version: { ...version, streamId: projectId },
          type: ProjectVersionsUpdatedMessageType.Created,
          modelId
        }
      })
    ])
  }

const reportVersionUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof VersionEvents.Updated>) => {
    const { projectId, newVersion, update, modelId } = payload.payload

    const legacyUpdateStruct: CommitUpdateInput = isOldVersionUpdateInput(update)
      ? update
      : {
          id: update.versionId,
          message: update.message,
          streamId: projectId
        }

    await Promise.all([
      deps.publish(CommitPubsubEvents.CommitUpdated, {
        commitUpdated: { ...legacyUpdateStruct },
        streamId: projectId,
        commitId: newVersion.id
      }),
      deps.publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId,
        projectVersionsUpdated: {
          id: newVersion.id,
          version: { ...newVersion, streamId: projectId },
          type: ProjectVersionsUpdatedMessageType.Updated,
          modelId
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
      DependenciesOf<typeof reportModelDeletedFactory> &
      DependenciesOf<typeof reportVersionMovedModelFactory> &
      DependenciesOf<typeof reportVersionDeletedFactory> &
      DependenciesOf<typeof reportVersionCreatedFactory> &
      DependenciesOf<typeof reportVersionUpdatedFactory>
  ) =>
  () => {
    const reportModelCreated = reportModelCreatedFactory(deps)
    const reportModelUpdated = reportModelUpdatedFactory(deps)
    const reportModelDeleted = reportModelDeletedFactory(deps)

    const reportVersionMovedModel = reportVersionMovedModelFactory(deps)
    const reportVersionDeleted = reportVersionDeletedFactory(deps)
    const reportVersionCreated = reportVersionCreatedFactory(deps)
    const reportVersionUpdated = reportVersionUpdatedFactory(deps)

    const quitCbs = [
      // Models
      deps.eventListen(ModelEvents.Created, reportModelCreated),
      deps.eventListen(ModelEvents.Updated, reportModelUpdated),
      deps.eventListen(ModelEvents.Deleted, reportModelDeleted),
      // Versions
      deps.eventListen(VersionEvents.MovedModel, reportVersionMovedModel),
      deps.eventListen(VersionEvents.Deleted, reportVersionDeleted),
      deps.eventListen(VersionEvents.Created, reportVersionCreated),
      deps.eventListen(VersionEvents.Updated, reportVersionUpdated)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
