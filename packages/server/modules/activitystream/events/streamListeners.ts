import type {
  AddStreamDeletedActivity,
  AddStreamUpdatedActivity,
  SaveActivity,
  SaveStreamActivity
} from '@/modules/activitystream/domain/operations'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import type {
  ProjectCreateInput,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import type { StreamRecord } from '@/modules/core/helpers/types'
import type { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'

// Activity

const addProjectPermissionsAddedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { activityUserId, project, role, targetUserId, previousRole }
  }: EventPayload<typeof ProjectEvents.PermissionsAdded>) => {
    await saveActivity({
      contextResourceId: project.id,
      contextResourceType: 'project',
      eventType: 'project_role_updated',
      userId: activityUserId,
      payload: {
        version: '1',
        userId: targetUserId,
        new: role,
        old: previousRole
      }
    })
  }

const addProjectPermissionsRevokedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async ({
    payload: { activityUserId, project, removedUserId, role }
  }: EventPayload<typeof ProjectEvents.PermissionsRevoked>) => {
    await saveActivity({
      contextResourceId: project.id,
      contextResourceType: 'project',
      eventType: 'project_role_deleted',
      userId: activityUserId,
      payload: {
        version: '1',
        userId: removedUserId,
        old: role
      }
    })
  }

// Stream activity

/**
 * Save "user created stream" activity item
 */
const addStreamCreatedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: {
    streamId: string
    creatorId: string
    input: StreamCreateInput | ProjectCreateInput
    stream: StreamRecord
  }) => {
    const { streamId, creatorId, input } = params

    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Stream,
      resourceId: streamId,
      actionType: StreamActionTypes.Stream.Create,
      userId: creatorId,
      info: { input },
      message: `Stream ${input.name} created`
    })
  }

/**
 * Save "stream updated" activity
 */
const addStreamUpdatedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddStreamUpdatedActivity =>
  async (params) => {
    const { streamId, updaterId, oldStream, update } = params

    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Stream,
      resourceId: streamId,
      actionType: StreamActionTypes.Stream.Update,
      userId: updaterId,
      info: { old: oldStream, new: update },
      message: 'Stream metadata changed'
    })
  }

/**
 * Save "stream deleted" activity
 */
const addStreamDeletedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddStreamDeletedActivity =>
  async (params) => {
    const { streamId, deleterId } = params

    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Stream,
      resourceId: streamId,
      actionType: StreamActionTypes.Stream.Delete,
      userId: deleterId,
      info: {},
      message: `Stream deleted`
    })
  }

/**
 * Save "user cloned stream X" activity item
 */
const addStreamClonedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: {
    sourceStreamId: string
    newStream: StreamRecord
    clonerId: string
  }) => {
    const { sourceStreamId, newStream, clonerId } = params
    const newStreamId = newStream.id

    await saveStreamActivity({
      streamId: newStreamId,
      resourceType: StreamResourceTypes.Stream,
      resourceId: newStreamId,
      actionType: StreamActionTypes.Stream.Clone,
      userId: clonerId,
      info: { sourceStreamId, newStreamId, clonerId },
      message: `User ${clonerId} cloned stream ${sourceStreamId} as ${newStreamId}`
    })
  }

export const reportStreamActivityFactory =
  (deps: {
    eventListen: EventBusListen
    saveActivity: SaveActivity
    saveStreamActivity: SaveStreamActivity
  }) =>
  () => {
    const addProjectPermissionsAddedActivity =
      addProjectPermissionsAddedActivityFactory(deps)
    const addProjectPermissionsRevokedActivity =
      addProjectPermissionsRevokedActivityFactory(deps)
    const addStreamCreatedActivity = addStreamCreatedActivityFactory(deps)
    const addStreamUpdatedActivity = addStreamUpdatedActivityFactory(deps)
    const addStreamDeletedActivity = addStreamDeletedActivityFactory(deps)
    const addStreamClonedActivity = addStreamClonedActivityFactory(deps)

    const quitters = [
      deps.eventListen(
        ProjectEvents.PermissionsAdded,
        addProjectPermissionsAddedActivity
      ),
      deps.eventListen(
        ProjectEvents.PermissionsRevoked,
        addProjectPermissionsRevokedActivity
      ),
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
      })
    ]

    return () => {
      quitters.forEach((q) => q())
    }
  }
