import {
  AddStreamDeletedActivity,
  AddStreamUpdatedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import {
  ProjectCreateInput,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRecord } from '@/modules/core/helpers/types'
import { EventBusListen } from '@/modules/shared/services/eventBus'
import { StreamRoles } from '@speckle/shared'

/**
 * Save "user created stream" activity item
 */
const addStreamCreatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (params: {
    streamId: string
    creatorId: string
    input: StreamCreateInput | ProjectCreateInput
    stream: StreamRecord
  }) => {
    const { streamId, creatorId, input } = params

    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.Create,
      userId: creatorId,
      info: { input },
      message: `Stream ${input.name} created`
    })
  }

/**
 * Save "stream updated" activity
 */
const addStreamUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }): AddStreamUpdatedActivity =>
  async (params) => {
    const { streamId, updaterId, oldStream, update } = params

    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.Update,
      userId: updaterId,
      info: { old: oldStream, new: update },
      message: 'Stream metadata changed'
    })
  }

/**
 * Save "stream deleted" activity
 */
const addStreamDeletedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }): AddStreamDeletedActivity =>
  async (params) => {
    const { streamId, deleterId } = params

    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.Delete,
      userId: deleterId,
      info: {},
      message: `Stream deleted`
    })
  }

/**
 * Save "user cloned stream X" activity item
 */
const addStreamClonedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (params: {
    sourceStreamId: string
    newStream: StreamRecord
    clonerId: string
  }) => {
    const { sourceStreamId, newStream, clonerId } = params
    const newStreamId = newStream.id

    await saveActivity({
      streamId: newStreamId,
      resourceType: ResourceTypes.Stream,
      resourceId: newStreamId,
      actionType: ActionTypes.Stream.Clone,
      userId: clonerId,
      info: { sourceStreamId, newStreamId, clonerId },
      message: `User ${clonerId} cloned stream ${sourceStreamId} as ${newStreamId}`
    })
  }

/**
 * Save "stream permissions granted to user" activity item
 */
const addStreamPermissionsAddedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (params: {
    streamId: string
    activityUserId: string
    targetUserId: string
    role: StreamRoles
  }) => {
    const { streamId, activityUserId, targetUserId, role } = params
    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsAdd,
      userId: activityUserId,
      info: { targetUser: targetUserId, role },
      message: `Permission granted to user ${targetUserId} (${role})`
    })
  }

/**
 * Save "stream permissions revoked for user" activity item
 */
const addStreamPermissionsRevokedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (params: {
    streamId: string
    activityUserId: string
    removedUserId: string
    stream: StreamRecord
  }) => {
    const { streamId, activityUserId, removedUserId } = params
    const isVoluntaryLeave = activityUserId === removedUserId

    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsRemove,
      userId: activityUserId,
      info: { targetUser: removedUserId },
      message: isVoluntaryLeave
        ? `User ${removedUserId} left the stream`
        : `Permission revoked for user ${removedUserId}`
    })
  }

export const reportStreamActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addStreamCreatedActivity = addStreamCreatedActivityFactory(deps)
    const addStreamUpdatedActivity = addStreamUpdatedActivityFactory(deps)
    const addStreamDeletedActivity = addStreamDeletedActivityFactory(deps)
    const addStreamClonedActivity = addStreamClonedActivityFactory(deps)
    const addStreamPermissionsAddedActivity =
      addStreamPermissionsAddedActivityFactory(deps)
    const addStreamPermissionsRevokedActivity =
      addStreamPermissionsRevokedActivityFactory(deps)

    const quitters = [
      deps.eventListen(ProjectEvents.Created, async ({ payload }) => {
        await addStreamCreatedActivity({
          stream: payload.project,
          input: payload.project,
          creatorId: payload.ownerId,
          streamId: payload.project.id
        })
      }),
      deps.eventListen(ProjectEvents.Updated, async ({ payload }) => {
        await addStreamUpdatedActivity({
          streamId: payload.newProject.id,
          updaterId: payload.updaterId,
          oldStream: payload.oldProject,
          newStream: payload.newProject,
          update: payload.update
        })
      }),
      deps.eventListen(ProjectEvents.Deleted, async ({ payload }) => {
        await addStreamDeletedActivity({
          streamId: payload.projectId,
          deleterId: payload.deleterId,
          workspaceId: payload.project.workspaceId
        })
      }),
      deps.eventListen(ProjectEvents.Cloned, async ({ payload }) => {
        await addStreamClonedActivity({
          sourceStreamId: payload.sourceProject.id,
          newStream: payload.newProject,
          clonerId: payload.clonerId
        })
      }),
      deps.eventListen(ProjectEvents.PermissionsAdded, async ({ payload }) => {
        await addStreamPermissionsAddedActivity({
          streamId: payload.project.id,
          activityUserId: payload.activityUserId,
          targetUserId: payload.targetUserId,
          role: payload.role
        })
      }),
      deps.eventListen(ProjectEvents.PermissionsRevoked, async ({ payload }) => {
        await addStreamPermissionsRevokedActivity({
          streamId: payload.project.id,
          activityUserId: payload.activityUserId,
          removedUserId: payload.removedUserId,
          stream: payload.project
        })
      })
    ]

    return () => {
      quitters.forEach((q) => q())
    }
  }
