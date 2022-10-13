import { saveActivity } from '@/modules/activitystream/services'
import { ActionTypes } from '@/modules/activitystream/helpers/types'
import { CommitPubsubEvents, pubsub } from '@/modules/shared'
import { CommitCreateInput } from '@/modules/core/graph/generated/graphql'

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
      resourceType: 'commit',
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
