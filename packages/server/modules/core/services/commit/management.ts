import {
  addCommitCreatedActivity,
  addCommitDeletedActivity,
  addCommitReceivedActivity,
  addCommitUpdatedActivity
} from '@/modules/activitystream/services/commitActivity'
import {
  CommitCreateError,
  CommitDeleteError,
  CommitReceiveError,
  CommitUpdateError
} from '@/modules/core/errors/commit'
import { VersionEvents, VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  CommitReceivedInput,
  CommitUpdateInput,
  MarkReceivedVersionInput,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import {
  getBranchById,
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
import {
  getCommitStream,
  getStream,
  markCommitStreamUpdated
} from '@/modules/core/repositories/streams'
import { ensureError, MaybeNullOrUndefined, Nullable, Roles } from '@speckle/shared'
import { has } from 'lodash'

export async function markCommitReceivedAndNotify(params: {
  input: MarkReceivedVersionInput | CommitReceivedInput
  userId: string
}) {
  const { input, userId } = params

  const oldInput: CommitReceivedInput =
    'projectId' in input
      ? {
          ...input,
          streamId: input.projectId,
          commitId: input.versionId
        }
      : input

  const commit = await getCommit(oldInput.commitId, { streamId: oldInput.streamId })
  if (!commit) {
    throw new CommitReceiveError(
      `Failed to find commit with id ${oldInput.commitId} in stream ${oldInput.streamId}.`,
      { info: params }
    )
  }

  await addCommitReceivedActivity({
    input: oldInput,
    userId
  })
}

export async function createCommitByBranchId(
  params: {
    streamId: string
    branchId: string
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
    branchId,
    objectId,
    authorId,
    message,
    sourceApplication,
    parents
  } = params
  const { notify = true } = options || {}

  // If no total children count is passed in, get it from the original object
  // that this commit references.
  let totalChildrenCount = params.totalChildrenCount
  if (!totalChildrenCount) {
    const obj = await getObject(objectId, streamId)
    if (!obj)
      throw new CommitCreateError("Couldn't find commit object", { info: params })

    totalChildrenCount = obj.totalChildrenCount || 1
  }

  const branch = await getBranchById(branchId, { streamId })
  if (!branch) {
    throw new CommitCreateError(`Failed to find branch with id ${branchId}.`, {
      info: params
    })
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

  await Promise.all([
    markCommitStreamUpdated(id),
    markCommitBranchUpdated(id),
    VersionsEmitter.emit(VersionEvents.Created, {
      projectId: streamId,
      modelId: branchId,
      version: commit
    }),
    ...(notify
      ? [
          addCommitCreatedActivity({
            commitId: commit.id,
            streamId,
            userId: authorId,
            branchName: branch.name,
            input: {
              ...commit,
              branchName: branch.name,
              objectId,
              streamId
            },
            modelId: branch.id,
            commit
          })
        ]
      : [])
  ])

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
  let myBranch = await getStreamBranchByName(streamId, branchName)
  if (!myBranch) {
    myBranch = (await getBranchById(branchName)) || null
  }
  if (!myBranch) {
    throw new CommitCreateError(
      `Failed to find branch with name or id ${branchName}.`,
      {
        info: params
      }
    )
  }

  const commit = await createCommitByBranchId(
    {
      streamId,
      branchId: myBranch.id,
      objectId,
      authorId,
      message,
      sourceApplication,
      totalChildrenCount,
      parents
    },
    { notify }
  )

  return commit
}

const isOldVersionUpdateInput = (
  i: CommitUpdateInput | UpdateVersionInput
): i is CommitUpdateInput => has(i, 'streamId')

export async function updateCommitAndNotify(
  params: CommitUpdateInput | UpdateVersionInput,
  userId: string
) {
  const {
    message,
    newBranchName,
    streamId,
    id: commitId
  } = isOldVersionUpdateInput(params)
    ? params
    : {
        message: params.message,
        id: params.versionId,
        streamId: null,
        newBranchName: null
      }

  if (!message && !newBranchName) {
    throw new CommitUpdateError('Nothing to update', {
      info: { ...params, userId }
    })
  }

  const [commit, stream] = await Promise.all([
    getCommit(commitId),
    streamId ? getStream({ streamId, userId }) : getCommitStream({ commitId, userId })
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

  let newCommit: CommitRecord = commit
  if (message) {
    newCommit = await updateCommit(commitId, { message })
  }

  if (commit) {
    await addCommitUpdatedActivity({
      commitId,
      streamId: stream.id,
      userId,
      originalCommit: commit,
      update: params,
      newCommit
    })

    await Promise.all([
      markCommitStreamUpdated(commit.id),
      markCommitBranchUpdated(commit.id)
    ])
  }

  return newCommit
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

  const [, updatedBranch] = await Promise.all([
    markCommitStreamUpdated(commit.id),
    markCommitBranchUpdated(commit.id)
  ])

  const isDeleted = await deleteCommit(commitId)
  if (isDeleted) {
    await addCommitDeletedActivity({
      commitId,
      streamId,
      userId,
      commit,
      branchId: updatedBranch.id
    })
  }

  return isDeleted
}
