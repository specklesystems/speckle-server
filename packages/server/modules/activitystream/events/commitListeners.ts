import type {
  AddCommitCreatedActivity,
  AddCommitDeletedActivity,
  AddCommitUpdatedActivity,
  SaveStreamActivity
} from '@/modules/activitystream/domain/operations'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { VersionEvents } from '@/modules/core/domain/commits/events'
import type { CommitCreateInput } from '@/modules/core/graph/generated/graphql'
import type { CommitRecord } from '@/modules/core/helpers/types'
import type { EventBusListen } from '@/modules/shared/services/eventBus'
import type { MaybeNullOrUndefined } from '@speckle/shared'

/**
 * Save "new commit created" activity item
 */
const addCommitCreatedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddCommitCreatedActivity =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    input: CommitCreateInput
    branchName: string
    modelId: string
    commit: CommitRecord
  }) => {
    const { commitId, input, streamId, userId, branchName, commit, modelId } = params
    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Commit,
      resourceId: commitId,
      actionType: StreamActionTypes.Commit.Create,
      userId,
      info: {
        id: commitId,
        commit: {
          ...input,
          projectId: streamId,
          modelId,
          versionId: commit.id
        }
      },
      message: `Commit created on branch ${branchName}: ${commitId} (${input.message})`
    })
  }

const addCommitUpdatedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddCommitUpdatedActivity =>
  async (params) => {
    const { commitId, streamId, userId, originalCommit, update } = params

    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Commit,
      resourceId: commitId,
      actionType: StreamActionTypes.Commit.Update,
      userId,
      info: { old: originalCommit, new: update },
      message: `Commit updated: ${commitId}`
    })
  }

const addCommitMovedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    originalBranchId: string
    newBranchId: string
    commit: CommitRecord
  }) => {
    const { commitId, streamId, userId, originalBranchId, newBranchId } = params
    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Commit,
      resourceId: commitId,
      actionType: StreamActionTypes.Commit.Move,
      userId,
      info: { originalBranchId, newBranchId },
      message: `Commit moved: ${commitId}`
    })
  }

const addCommitDeletedActivityFactory =
  ({
    saveStreamActivity
  }: {
    saveStreamActivity: SaveStreamActivity
  }): AddCommitDeletedActivity =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    commit: CommitRecord
    branchId: string
  }) => {
    const { commitId, streamId, userId, commit } = params
    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Commit,
      resourceId: commitId,
      actionType: StreamActionTypes.Commit.Delete,
      userId,
      info: { commit },
      message: `Commit deleted: ${commitId}`
    })
  }

const addCommitReceivedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: {
    streamId: string
    commitId: string
    userId: string
    sourceApplication: string
    message: MaybeNullOrUndefined<string>
  }) => {
    const { streamId, commitId, userId, sourceApplication, message } = params
    await saveStreamActivity({
      streamId,
      resourceType: StreamResourceTypes.Commit,
      resourceId: commitId,
      actionType: StreamActionTypes.Commit.Receive,
      userId,
      info: {
        sourceApplication,
        message
      },
      message: `Commit $commitId} was received by user ${userId}`
    })
  }

export const reportCommitActivityFactory =
  (deps: { eventListen: EventBusListen; saveStreamActivity: SaveStreamActivity }) =>
  () => {
    const addCommitCreatedActivity = addCommitCreatedActivityFactory(deps)
    const addCommitUpdatedActivity = addCommitUpdatedActivityFactory(deps)
    const addCommitMovedActivity = addCommitMovedActivityFactory(deps)
    const addCommitDeletedActivity = addCommitDeletedActivityFactory(deps)
    const addCommitReceivedActivity = addCommitReceivedActivityFactory(deps)

    const quitters = [
      deps.eventListen(VersionEvents.Created, async ({ payload }) => {
        await addCommitCreatedActivity({
          commitId: payload.version.id,
          streamId: payload.projectId,
          userId: payload.userId,
          input: payload.input,
          branchName: payload.modelName,
          modelId: payload.modelId,
          commit: payload.version
        })
      }),
      deps.eventListen(VersionEvents.Updated, async ({ payload }) => {
        await addCommitUpdatedActivity({
          commitId: payload.versionId,
          streamId: payload.projectId,
          userId: payload.userId,
          originalCommit: payload.oldVersion,
          update: payload.update,
          newCommit: payload.newVersion,
          branchId: payload.modelId
        })
      }),
      deps.eventListen(VersionEvents.MovedModel, async ({ payload }) => {
        await addCommitMovedActivity({
          commitId: payload.version.id,
          streamId: payload.projectId,
          userId: payload.userId,
          originalBranchId: payload.originalModelId,
          newBranchId: payload.newModelId,
          commit: payload.version
        })
      }),
      deps.eventListen(VersionEvents.Deleted, async ({ payload }) => {
        await addCommitDeletedActivity({
          commitId: payload.versionId,
          streamId: payload.projectId,
          userId: payload.userId,
          commit: payload.version,
          branchId: payload.modelId
        })
      }),
      deps.eventListen(VersionEvents.Received, async ({ payload }) => {
        await addCommitReceivedActivity({
          streamId: payload.projectId,
          commitId: payload.versionId,
          userId: payload.userId,
          sourceApplication: payload.sourceApplication,
          message: payload.message
        })
      })
    ]

    return () => {
      quitters.forEach((q) => q())
    }
  }
