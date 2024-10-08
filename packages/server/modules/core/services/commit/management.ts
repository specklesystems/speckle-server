import { db } from '@/db/knex'
import {
  addCommitCreatedActivity,
  addCommitDeletedActivity,
  addCommitReceivedActivity,
  addCommitUpdatedActivity
} from '@/modules/activitystream/services/commitActivity'
import {
  GetBranchById,
  GetStreamBranchByName,
  MarkCommitBranchUpdated
} from '@/modules/core/domain/branches/operations'
import {
  CreateCommitByBranchId,
  CreateCommitByBranchName,
  DeleteCommit,
  DeleteCommitAndNotify,
  GetCommit,
  GetCommitBranch,
  InsertBranchCommits,
  InsertStreamCommits,
  StoreCommit,
  SwitchCommitBranch,
  UpdateCommit,
  UpdateCommitAndNotify
} from '@/modules/core/domain/commits/operations'
import { GetObject } from '@/modules/core/domain/objects/operations'
import {
  CommitCreateError,
  CommitDeleteError,
  CommitReceiveError,
  CommitUpdateError
} from '@/modules/core/errors/commit'
import {
  VersionEvents,
  VersionsEventEmitter
} from '@/modules/core/events/versionsEmitter'
import {
  CommitReceivedInput,
  CommitUpdateInput,
  MarkReceivedVersionInput,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { CommitRecord } from '@/modules/core/helpers/types'
import { getCommitFactory } from '@/modules/core/repositories/commits'
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

  const commit = await getCommitFactory({ db })(oldInput.commitId, {
    streamId: oldInput.streamId
  })
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

export const createCommitByBranchIdFactory =
  (deps: {
    createCommit: StoreCommit
    getObject: GetObject
    getBranchById: GetBranchById
    insertStreamCommits: InsertStreamCommits
    insertBranchCommits: InsertBranchCommits
    markCommitStreamUpdated: typeof markCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
    versionsEventEmitter: VersionsEventEmitter
    addCommitCreatedActivity: typeof addCommitCreatedActivity
  }): CreateCommitByBranchId =>
  async (
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
  ) => {
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
      const obj = await deps.getObject(objectId, streamId)
      if (!obj)
        throw new CommitCreateError("Couldn't find commit object", { info: params })

      totalChildrenCount = obj.totalChildrenCount || 1
    }

    const branch = await deps.getBranchById(branchId, { streamId })
    if (!branch) {
      throw new CommitCreateError(`Failed to find branch with id ${branchId}.`, {
        info: params
      })
    }

    // Create main table entry
    const commit = await deps.createCommit({
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
      deps.insertBranchCommits([{ branchId, commitId: id }]),
      deps.insertStreamCommits([{ streamId, commitId: id }])
    ])

    await Promise.all([
      deps.markCommitStreamUpdated(id),
      deps.markCommitBranchUpdated(id),
      deps.versionsEventEmitter(VersionEvents.Created, {
        projectId: streamId,
        modelId: branchId,
        version: commit
      }),
      ...(notify
        ? [
            deps.addCommitCreatedActivity({
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

export const createCommitByBranchNameFactory =
  (deps: {
    createCommitByBranchId: CreateCommitByBranchId
    getStreamBranchByName: GetStreamBranchByName
    getBranchById: GetBranchById
  }): CreateCommitByBranchName =>
  async (
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
  ) => {
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
    let myBranch = await deps.getStreamBranchByName(streamId, branchName)
    if (!myBranch) {
      myBranch = (await deps.getBranchById(branchName)) || null
    }
    if (!myBranch) {
      throw new CommitCreateError(
        `Failed to find branch with name or id ${branchName}.`,
        {
          info: params
        }
      )
    }

    const commit = await deps.createCommitByBranchId(
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

export const updateCommitAndNotifyFactory =
  (deps: {
    getCommit: GetCommit
    getStream: typeof getStream
    getCommitStream: typeof getCommitStream
    getStreamBranchByName: GetStreamBranchByName
    getCommitBranch: GetCommitBranch
    switchCommitBranch: SwitchCommitBranch
    updateCommit: UpdateCommit
    addCommitUpdatedActivity: typeof addCommitUpdatedActivity
    markCommitStreamUpdated: typeof markCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
  }): UpdateCommitAndNotify =>
  async (params: CommitUpdateInput | UpdateVersionInput, userId: string) => {
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
      deps.getCommit(commitId),
      streamId
        ? deps.getStream({ streamId, userId })
        : deps.getCommitStream({ commitId, userId })
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
          deps.getStreamBranchByName(streamId, newBranchName),
          deps.getCommitBranch(commitId)
        ])

        if (!newBranch || !oldBranch) {
          throw new Error("Couldn't resolve branch")
        }
        if (!commit) {
          throw new Error("Couldn't find commit")
        }

        await deps.switchCommitBranch(commitId, newBranch.id, oldBranch.id)
      } catch (e) {
        throw new CommitUpdateError('Failed to update commit branch', {
          cause: ensureError(e),
          info: params
        })
      }
    }

    let newCommit: CommitRecord = commit
    if (message) {
      newCommit = await deps.updateCommit(commitId, { message })
    }

    if (commit) {
      await deps.addCommitUpdatedActivity({
        commitId,
        streamId: stream.id,
        userId,
        originalCommit: commit,
        update: params,
        newCommit
      })

      await Promise.all([
        deps.markCommitStreamUpdated(commit.id),
        deps.markCommitBranchUpdated(commit.id)
      ])
    }

    return newCommit
  }

export const deleteCommitAndNotifyFactory =
  (deps: {
    getCommit: GetCommit
    markCommitStreamUpdated: typeof markCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
    deleteCommit: DeleteCommit
    addCommitDeletedActivity: typeof addCommitDeletedActivity
  }): DeleteCommitAndNotify =>
  async (commitId: string, streamId: string, userId: string) => {
    const commit = await deps.getCommit(commitId)
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
      deps.markCommitStreamUpdated(commit.id),
      deps.markCommitBranchUpdated(commit.id)
    ])

    const isDeleted = await deps.deleteCommit(commitId)
    if (isDeleted) {
      await deps.addCommitDeletedActivity({
        commitId,
        streamId,
        userId,
        commit,
        branchId: updatedBranch.id
      })
    }

    return isDeleted
  }
