import { ModelEvents } from '@/modules/core/domain/branches/events'
import { VersionEvents } from '@/modules/core/domain/commits/events'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import {
  CommitUpdateInput,
  ProjectModelsUpdatedMessageType,
  ProjectUpdatedMessageType,
  ProjectVersionsUpdatedMessageType,
  UserProjectsUpdatedMessageType,
  WorkspaceProjectsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { isOldVersionUpdateInput } from '@/modules/core/services/commit/management'
import {
  BranchPubsubEvents,
  CommitPubsubEvents,
  StreamPubsubEvents
} from '@/modules/shared'
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  ProjectSubscriptions,
  PublishSubscription,
  UserSubscriptions,
  WorkspaceSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { chunk, flatten } from 'lodash'

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

const reportProjectCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ProjectEvents.Created>) => {
    const { project: stream, ownerId: creatorId, input } = payload.payload
    const streamId = stream.id

    await Promise.all([
      deps.publish(StreamPubsubEvents.UserStreamAdded, {
        userStreamAdded: { id: streamId, ...input },
        ownerId: creatorId
      }),
      deps.publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: streamId,
          type: UserProjectsUpdatedMessageType.Added,
          project: stream
        },
        ownerId: creatorId
      }),
      ...(stream.workspaceId
        ? [
            deps.publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
              workspaceProjectsUpdated: {
                projectId: streamId,
                type: WorkspaceProjectsUpdatedMessageType.Added,
                project: stream,
                workspaceId: stream.workspaceId
              },
              workspaceId: stream.workspaceId
            })
          ]
        : [])
    ])
  }

const reportProjectUpdatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ProjectEvents.Updated>) => {
    const { newProject, update } = payload.payload
    const streamId = newProject.id

    await Promise.all([
      deps.publish(StreamPubsubEvents.StreamUpdated, {
        streamUpdated: {
          ...update
        },
        id: streamId
      }),
      deps.publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: newProject
        }
      })
    ])
  }

const reportProjectDeletedFactory =
  (deps: {
    publish: PublishSubscription
    getStreamCollaborators: GetStreamCollaborators
  }) =>
  async (payload: EventPayload<typeof ProjectEvents.Deleted>) => {
    const { projectId, project } = payload.payload
    const streamId = projectId
    const workspaceId = project.workspaceId

    // Notify any listeners on streamId/workspaceId
    await Promise.all([
      deps.publish(StreamPubsubEvents.StreamDeleted, {
        streamDeleted: { streamId },
        streamId
      }),
      deps.publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Deleted,
          project: null
        }
      }),
      ...(workspaceId
        ? [
            deps.publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
              workspaceProjectsUpdated: {
                projectId: streamId,
                type: WorkspaceProjectsUpdatedMessageType.Removed,
                project: null,
                workspaceId
              },
              workspaceId
            })
          ]
        : [])
    ])

    // Notify all stream users
    const users = await deps.getStreamCollaborators(streamId)
    const userBatches = chunk(users, 15)
    for (const userBatch of userBatches) {
      await Promise.all(
        flatten(
          userBatch.map((u) => [
            deps.publish(StreamPubsubEvents.UserStreamRemoved, {
              userStreamRemoved: { id: streamId },
              ownerId: u.id
            }),
            deps.publish(UserSubscriptions.UserProjectsUpdated, {
              userProjectsUpdated: {
                id: streamId,
                type: UserProjectsUpdatedMessageType.Removed,
                project: null
              },
              ownerId: u.id
            })
          ])
        )
      )
    }
  }

const reportStreamClonedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ProjectEvents.Cloned>) => {
    const { newProject, clonerId } = payload.payload

    await Promise.all([
      deps.publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: newProject.id,
          type: UserProjectsUpdatedMessageType.Added,
          project: newProject
        },
        ownerId: clonerId
      }),
      ...(newProject.workspaceId
        ? [
            deps.publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
              workspaceProjectsUpdated: {
                projectId: newProject.id,
                type: WorkspaceProjectsUpdatedMessageType.Added,
                project: newProject,
                workspaceId: newProject.workspaceId
              },
              workspaceId: newProject.workspaceId
            })
          ]
        : [])
    ])
  }

const reportStreamPermissionsAddedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ProjectEvents.PermissionsAdded>) => {
    const { activityUserId, targetUserId, project } = payload.payload

    await Promise.all([
      deps.publish(StreamPubsubEvents.UserStreamAdded, {
        userStreamAdded: {
          id: project.id,
          sharedBy: activityUserId
        },
        ownerId: targetUserId
      }),
      deps.publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: project.id,
          type: UserProjectsUpdatedMessageType.Added,
          project
        },
        ownerId: targetUserId
      }),
      deps.publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: project.id,
          type: ProjectUpdatedMessageType.Updated,
          project
        }
      })
    ])
  }

const reportStreamPermissionsRevokedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof ProjectEvents.PermissionsRevoked>) => {
    const { activityUserId, removedUserId, project } = payload.payload

    await Promise.all([
      deps.publish(StreamPubsubEvents.UserStreamRemoved, {
        userStreamRemoved: {
          id: project.id,
          revokedBy: activityUserId
        },
        ownerId: removedUserId
      }),
      deps.publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: project.id,
          type: UserProjectsUpdatedMessageType.Removed,
          project: null
        },
        ownerId: removedUserId
      }),
      deps.publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: project.id,
          type: ProjectUpdatedMessageType.Updated,
          project
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
      DependenciesOf<typeof reportVersionUpdatedFactory> &
      DependenciesOf<typeof reportProjectCreatedFactory> &
      DependenciesOf<typeof reportProjectUpdatedFactory> &
      DependenciesOf<typeof reportProjectDeletedFactory> &
      DependenciesOf<typeof reportStreamClonedFactory> &
      DependenciesOf<typeof reportStreamPermissionsAddedFactory> &
      DependenciesOf<typeof reportStreamPermissionsRevokedFactory>
  ) =>
  () => {
    const reportModelCreated = reportModelCreatedFactory(deps)
    const reportModelUpdated = reportModelUpdatedFactory(deps)
    const reportModelDeleted = reportModelDeletedFactory(deps)

    const reportVersionMovedModel = reportVersionMovedModelFactory(deps)
    const reportVersionDeleted = reportVersionDeletedFactory(deps)
    const reportVersionCreated = reportVersionCreatedFactory(deps)
    const reportVersionUpdated = reportVersionUpdatedFactory(deps)

    const reportProjectCreated = reportProjectCreatedFactory(deps)
    const reportProjectUpdated = reportProjectUpdatedFactory(deps)
    const reportProjectDeleted = reportProjectDeletedFactory(deps)
    const reportProjectCloned = reportStreamClonedFactory(deps)
    const reportProjectPermissionsAdded = reportStreamPermissionsAddedFactory(deps)
    const reportStreamPermissionsRevoked = reportStreamPermissionsRevokedFactory(deps)

    const quitCbs = [
      // Models
      deps.eventListen(ModelEvents.Created, reportModelCreated),
      deps.eventListen(ModelEvents.Updated, reportModelUpdated),
      deps.eventListen(ModelEvents.Deleted, reportModelDeleted),
      // Versions
      deps.eventListen(VersionEvents.MovedModel, reportVersionMovedModel),
      deps.eventListen(VersionEvents.Deleted, reportVersionDeleted),
      deps.eventListen(VersionEvents.Created, reportVersionCreated),
      deps.eventListen(VersionEvents.Updated, reportVersionUpdated),
      // Projects
      deps.eventListen(ProjectEvents.Created, reportProjectCreated),
      deps.eventListen(ProjectEvents.Updated, reportProjectUpdated),
      deps.eventListen(ProjectEvents.Deleted, reportProjectDeleted),
      deps.eventListen(ProjectEvents.Cloned, reportProjectCloned),
      deps.eventListen(ProjectEvents.PermissionsAdded, reportProjectPermissionsAdded),
      deps.eventListen(ProjectEvents.PermissionsRevoked, reportStreamPermissionsRevoked)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
