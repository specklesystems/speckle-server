import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { CommitPubsubEvents, pubsub } from '@/modules/shared'
import {
  CommitCreateInput,
  CommitReceivedInput,
  CommitUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'

/**
 * Save "new commit created" activity item
 */
export async function addCommitCreatedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  commit: CommitCreateInput
  branchName: string
}) {
  const { commitId, commit, streamId, userId, branchName } = params
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Commit,
      resourceId: commitId,
      actionType: ActionTypes.Commit.Create,
      userId,
      info: { id: commitId, commit },
      message: `Commit created on branch ${branchName}: ${commitId} (${commit.message})`
    }),
    pubsub.publish(CommitPubsubEvents.CommitCreated, {
      commitCreated: { ...commit, id: commitId, authorId: userId },
      streamId
    })
  ])
}

export async function addCommitUpdatedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  originalCommit: CommitRecord
  update: CommitUpdateInput
}) {
  const { commitId, streamId, userId, originalCommit, update } = params

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
    pubsub.publish(CommitPubsubEvents.CommitUpdated, {
      commitUpdated: { ...update },
      streamId,
      commitId
    })
  ])
}

export async function addCommitDeletedActivity(params: {
  commitId: string
  streamId: string
  userId: string
  commit: CommitRecord
}) {
  const { commitId, streamId, userId, commit } = params
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
    pubsub.publish(CommitPubsubEvents.CommitDeleted, {
      commitDeleted: { commitId, streamId },
      streamId
    })
  ])
}

export async function addCommitReceivedActivity(params: {
  input: CommitReceivedInput
  userId: string
}) {
  const { input, userId } = params

  await saveActivity({
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
