import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  CommitSubscriptions as CommitPubsubEvents,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'
import {
  CommitCreateInput,
  CommitUpdateInput,
  ProjectVersionsUpdatedMessageType,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import { ProjectSubscriptions } from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'
import {
  AddCommitCreatedActivity,
  AddCommitDeletedActivity,
  AddCommitUpdatedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'

/**
 * Save "new commit created" activity item
 */
export const addCommitCreatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
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
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Commit,
        resourceId: commitId,
        actionType: ActionTypes.Commit.Create,
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
      }),
      publish(CommitPubsubEvents.CommitCreated, {
        commitCreated: { ...input, id: commitId, authorId: userId },
        streamId
      }),
      publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId: streamId,
        projectVersionsUpdated: {
          id: commit.id,
          version: { ...commit, streamId },
          type: ProjectVersionsUpdatedMessageType.Created,
          modelId: null
        }
      })
    ])
  }

const isOldVersionUpdateInput = (
  i: CommitUpdateInput | UpdateVersionInput
): i is CommitUpdateInput => has(i, 'streamId')

export const addCommitUpdatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddCommitUpdatedActivity =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    originalCommit: CommitRecord
    update: CommitUpdateInput | UpdateVersionInput
    newCommit: CommitRecord
  }) => {
    const { commitId, streamId, userId, originalCommit, update, newCommit } = params
    const legacyUpdateStruct: CommitUpdateInput = isOldVersionUpdateInput(update)
      ? update
      : {
          id: update.versionId,
          message: update.message,
          streamId
        }

    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Commit,
        resourceId: commitId,
        actionType: ActionTypes.Commit.Update,
        userId,
        info: { old: originalCommit, new: update },
        message: `Commit updated: ${commitId}`
      }),
      publish(CommitPubsubEvents.CommitUpdated, {
        commitUpdated: { ...legacyUpdateStruct },
        streamId,
        commitId
      }),
      publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId: streamId,
        projectVersionsUpdated: {
          id: commitId,
          version: { ...newCommit, streamId },
          type: ProjectVersionsUpdatedMessageType.Updated,
          modelId: null
        }
      })
    ])
  }

export const addCommitMovedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    originalBranchId: string
    newBranchId: string
    commit: CommitRecord
  }) => {
    const { commitId, streamId, userId, originalBranchId, newBranchId, commit } = params
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Commit,
        resourceId: commitId,
        actionType: ActionTypes.Commit.Move,
        userId,
        info: { originalBranchId, newBranchId },
        message: `Commit moved: ${commitId}`
      }),
      publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId: streamId,
        projectVersionsUpdated: {
          id: commitId,
          version: { ...commit, streamId },
          type: ProjectVersionsUpdatedMessageType.Updated,
          modelId: null
        }
      })
    ])
  }

export const addCommitDeletedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddCommitDeletedActivity =>
  async (params: {
    commitId: string
    streamId: string
    userId: string
    commit: CommitRecord
    branchId: string
  }) => {
    const { commitId, streamId, userId, commit, branchId } = params
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Commit,
        resourceId: commitId,
        actionType: ActionTypes.Commit.Delete,
        userId,
        info: { commit },
        message: `Commit deleted: ${commitId}`
      }),
      publish(CommitPubsubEvents.CommitDeleted, {
        commitDeleted: { ...commit, streamId, branchId },
        streamId
      }),
      publish(ProjectSubscriptions.ProjectVersionsUpdated, {
        projectId: streamId,
        projectVersionsUpdated: {
          id: commitId,
          type: ProjectVersionsUpdatedMessageType.Deleted,
          version: null,
          modelId: branchId
        }
      })
    ])
  }
