import {
  addCommitCreatedActivity,
  addCommitDeletedActivity,
  addCommitUpdatedActivity
} from '@/modules/activitystream/services/commitActivity'
import {
  CommitCreateError,
  CommitDeleteError,
  CommitUpdateError
} from '@/modules/core/errors/commit'
import { CommitUpdateInput } from '@/modules/core/graph/generated/graphql'
import {
  getStreamBranchByName,
  markCommitBranchUpdated
} from '@/modules/core/repositories/branches'
import {
  createCommit,
  deleteCommit,
  getCommit,
  getCommitBranch,
  insertBranchCommits,
  insertStreamCommits,
  switchCommitBranch,
  updateCommit
} from '@/modules/core/repositories/commits'
import { getObject } from '@/modules/core/repositories/objects'
import { getStream, markCommitStreamUpdated } from '@/modules/core/repositories/streams'
import { ensureError, MaybeNullOrUndefined, Nullable, Roles } from '@speckle/shared'

/**
 * Note: Doesn't notify subscriptions or save activityStream due to missing branchName
 */
export async function createCommitByBranchId(params: {
  streamId: string
  branchId: string
  objectId: string
  authorId: string
  message: Nullable<string>
  sourceApplication: Nullable<string>
  totalChildrenCount?: MaybeNullOrUndefined<number>
  parents: Nullable<string[]>
}) {
  const {
    streamId,
    branchId,
    objectId,
    authorId,
    message,
    sourceApplication,
    parents
  } = params

  // If no total children count is passed in, get it from the original object
  // that this commit references.
  let totalChildrenCount = params.totalChildrenCount
  if (!totalChildrenCount) {
    const obj = await getObject(objectId, streamId)
    if (!obj)
      throw new CommitCreateError("Couldn't find commit object", { info: params })

    totalChildrenCount = obj.totalChildrenCount || 1
  }

  // Create main table entry
  const commit = await createCommit({
    referencedObject: objectId,
    author: authorId,
    sourceApplication,
    totalChildrenCount,
    parents,
    message
  })
  const id = commit.id

  // Link it to a branch & stream
  await Promise.all([
    insertBranchCommits([{ branchId, commitId: id }]),
    insertStreamCommits([{ streamId, commitId: id }])
  ])

  await Promise.all([markCommitStreamUpdated(id), markCommitBranchUpdated(id)])

  return commit
}

export async function createCommitByBranchName(
  params: {
    streamId: string
    branchName: string
    objectId: string
    authorId: string
    message: Nullable<string>
    sourceApplication: Nullable<string>
    totalChildrenCount?: MaybeNullOrUndefined<number>
    parents: Nullable<string[]>
  },
  options?: Partial<{ notify: boolean }>
) {
  const {
    streamId,
    objectId,
    authorId,
    message,
    sourceApplication,
    parents,
    totalChildrenCount
  } = params

  const { notify = true } = options || {}

  const branchName = params.branchName.toLowerCase()
  const myBranch = await getStreamBranchByName(streamId, branchName)
  if (!myBranch)
    throw new CommitCreateError(`Failed to find branch with name ${branchName}.`, {
      info: params
    })

  const commit = await createCommitByBranchId({
    streamId,
    branchId: myBranch.id,
    objectId,
    authorId,
    message,
    sourceApplication,
    totalChildrenCount,
    parents
  })

  if (notify && commit.id) {
    await addCommitCreatedActivity({
      commitId: commit.id,
      streamId,
      userId: authorId,
      branchName,
      commit: { ...commit, branchName, objectId, streamId }
    })
  }

  return commit
}

export async function updateCommitAndNotify(params: CommitUpdateInput, userId: string) {
  const { message, newBranchName, streamId, id: commitId } = params
  if (!message && !newBranchName) {
    throw new CommitUpdateError('Please provide a message and/or a new branch name', {
      info: { ...params, userId }
    })
  }

  const [commit, stream] = await Promise.all([
    getCommit(commitId),
    getStream({ streamId, userId })
  ])
  if (!commit) {
    throw new CommitUpdateError("Can't update nonexistant commit", {
      info: { ...params, userId }
    })
  }
  if (!stream) {
    throw new CommitUpdateError("Can't resolve commit stream", {
      info: { ...params, userId }
    })
  }
  if (commit.author !== userId && stream.role !== Roles.Stream.Owner) {
    throw new CommitUpdateError(
      'Only the author of a commit or a stream owner may update it',
      {
        info: { ...params, userId, streamRole: stream.role }
      }
    )
  }

  if (newBranchName) {
    try {
      const [newBranch, oldBranch] = await Promise.all([
        getStreamBranchByName(streamId, newBranchName),
        getCommitBranch(commitId)
      ])

      if (!newBranch || !oldBranch) {
        throw new Error("Couldn't resolve branch")
      }
      if (!commit) {
        throw new Error("Couldn't find commit")
      }

      await switchCommitBranch(commitId, newBranch.id, oldBranch.id)
    } catch (e) {
      throw new CommitUpdateError('Failed to update commit branch', {
        cause: ensureError(e),
        info: params
      })
    }
  }

  if (message) {
    await updateCommit(commitId, { message })
  }

  if (commit) {
    await addCommitUpdatedActivity({
      commitId,
      streamId,
      userId,
      originalCommit: commit,
      update: params
    })

    await Promise.all([
      markCommitStreamUpdated(commit.id),
      markCommitBranchUpdated(commit.id)
    ])
  }
}

export async function deleteCommitAndNotify(
  commitId: string,
  streamId: string,
  userId: string
) {
  const commit = await getCommit(commitId)
  if (!commit) {
    throw new CommitDeleteError("Couldn't delete nonexistant commit", {
      info: { commitId, streamId, userId }
    })
  }

  if (commit.author !== userId) {
    throw new CommitDeleteError('Only the author of a commit may delete it', {
      info: { commitId, streamId, userId }
    })
  }

  await Promise.all([
    markCommitStreamUpdated(commit.id),
    markCommitBranchUpdated(commit.id)
  ])

  const isDeleted = await deleteCommit(commitId)
  if (isDeleted) {
    await addCommitDeletedActivity({
      commitId,
      streamId,
      userId,
      commit
    })
  }

  return isDeleted
}
