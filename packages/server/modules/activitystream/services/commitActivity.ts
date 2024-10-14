import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  CommitSubscriptions as CommitPubsubEvents,
  PublishSubscription,
  pubsub
} from '@/modules/shared/utils/subscriptions'
import {
  CommitCreateInput,
  CommitReceivedInput,
  CommitUpdateInput,
  ProjectVersionsUpdatedMessageType,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import { ProjectSubscriptions, publish } from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { db } from '@/db/knex'
import {
  AddCommitCreatedActivity,
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
    const { commitId, input, streamId, userId, branchName, commit } = params
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
            modelId: params.modelId,
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
          version: commit,
          type: ProjectVersionsUpdatedMessageType.Created,
          modelId: null
        }
      })
    ])
  }

const isOldVersionUpdateInput = (
  i: CommitUpdateInput | UpdateVersionInput
): i is CommitUpdateInput => has(i, 'streamId')

export async function addCommitUpdatedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  originalCommit: CommitRecord
  update: CommitUpdateInput | UpdateVersionInput
  newCommit: CommitRecord
}) {
  const { commitId, streamId, userId, originalCommit, update, newCommit } = params
  const legacyUpdateStruct: CommitUpdateInput = isOldVersionUpdateInput(update)
    ? update
    : {
        id: update.versionId,
        message: update.message,
        streamId
      }

  await Promise.all([
    saveActivityFactory({ db })({
      streamId,
      resourceType: ResourceTypes.Commit,
      resourceId: commitId,
      actionType: ActionTypes.Commit.Update,
      userId,
      info: { old: originalCommit, new: update },
      message: `Commit updated: ${commitId}`
    }),
    pubsub.publish(CommitPubsubEvents.CommitUpdated, {
      commitUpdated: { ...legacyUpdateStruct },
      streamId,
      commitId
    }),
    publish(ProjectSubscriptions.ProjectVersionsUpdated, {
      projectId: streamId,
      projectVersionsUpdated: {
        id: commitId,
        version: newCommit,
        type: ProjectVersionsUpdatedMessageType.Updated,
        modelId: null
      }
    })
  ])
}

export async function addCommitMovedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  originalBranchId: string
  newBranchId: string
  commit: CommitRecord
}) {
  const { commitId, streamId, userId, originalBranchId, newBranchId, commit } = params
  await Promise.all([
    saveActivityFactory({ db })({
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
        version: commit,
        type: ProjectVersionsUpdatedMessageType.Updated,
        modelId: null
      }
    })
  ])
}

export async function addCommitDeletedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  commit: CommitRecord
  branchId: string
}) {
  const { commitId, streamId, userId, commit, branchId } = params
  await Promise.all([
    saveActivityFactory({ db })({
      streamId,
      resourceType: ResourceTypes.Commit,
      resourceId: commitId,
      actionType: ActionTypes.Commit.Delete,
      userId,
      info: { commit },
      message: `Commit deleted: ${commitId}`
    }),
    pubsub.publish(CommitPubsubEvents.CommitDeleted, {
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

export async function addCommitReceivedActivity(params: {
  input: CommitReceivedInput
  userId: string
}) {
  const { input, userId } = params

  await saveActivityFactory({ db })({
    streamId: input.streamId,
    resourceType: ResourceTypes.Commit,
    resourceId: input.commitId,
    actionType: ActionTypes.Commit.Receive,
    userId,
    info: {
      sourceApplication: input.sourceApplication,
      message: input.message
    },
    message: `Commit ${input.commitId} was received by user ${userId}`
  })
}
