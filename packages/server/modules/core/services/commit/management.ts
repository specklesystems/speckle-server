import {
  GetBranchById,
  GetStreamBranchByName,
  MarkCommitBranchUpdated
} from '@/modules/core/domain/branches/operations'
import { VersionEvents } from '@/modules/core/domain/commits/events'
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
  GetCommitStream,
  GetStream,
  MarkCommitStreamUpdated
} from '@/modules/core/domain/streams/operations'
import {
  CommitCreateError,
  CommitDeleteError,
  CommitNotFoundError,
  CommitReceiveError,
  CommitUpdateError
} from '@/modules/core/errors/commit'
import {
  CommitReceivedInput,
  CommitUpdateInput,
  MarkReceivedVersionInput,
  UpdateVersionInput
} from '@/modules/core/graph/generated/graphql'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { ensureError, Roles } from '@speckle/shared'
import { has } from 'lodash'
import { BranchNotFoundError } from '@/modules/core/errors/branch'

export const markCommitReceivedAndNotifyFactory =
  ({ getCommit, emitEvent }: { getCommit: GetCommit; emitEvent: EventBusEmit }) =>
  async (params: {
    input: MarkReceivedVersionInput | CommitReceivedInput
    userId: string
  }) => {
    const { input, userId } = params

    const oldInput: CommitReceivedInput =
      'projectId' in input
        ? {
            ...input,
            streamId: input.projectId,
            commitId: input.versionId
          }
        : input

    const commit = await getCommit(oldInput.commitId, {
      streamId: oldInput.streamId
    })
    if (!commit) {
      throw new CommitReceiveError(
        `Failed to find commit with id ${oldInput.commitId} in stream ${oldInput.streamId}.`,
        { info: params }
      )
    }

    await emitEvent({
      eventName: VersionEvents.Received,
      payload: {
        projectId: oldInput.streamId,
        versionId: oldInput.commitId,
        userId,
        sourceApplication: oldInput.sourceApplication,
        message: oldInput.message
      }
    })
  }

export const createCommitByBranchIdFactory =
  (deps: {
    createCommit: StoreCommit
    getObject: GetObject
    getBranchById: GetBranchById
    insertStreamCommits: InsertStreamCommits
    insertBranchCommits: InsertBranchCommits
    markCommitStreamUpdated: MarkCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
    emitEvent: EventBusEmit
  }): CreateCommitByBranchId =>
  async (params) => {
    const {
      streamId,
      branchId,
      objectId,
      authorId,
      message,
      sourceApplication,
      parents,
      createdAt
    } = params

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
      message,
      ...(createdAt ? { createdAt } : {})
    })
    const id = commit.id

    // Link it to a branch & stream
    await Promise.all([
      deps.insertBranchCommits([{ branchId, commitId: id }]),
      deps.insertStreamCommits([{ streamId, commitId: id }])
    ])

    const input = {
      ...params,
      branchName: branch.name
    }
    await Promise.all([
      deps.markCommitStreamUpdated(id),
      deps.markCommitBranchUpdated(id),
      deps.emitEvent({
        eventName: VersionEvents.Created,
        payload: {
          projectId: streamId,
          modelId: branchId,
          version: commit,
          input,
          modelName: branch.name,
          userId: authorId
        }
      })
    ])

    return { ...commit, streamId, branchId }
  }

export const createCommitByBranchNameFactory =
  (deps: {
    createCommitByBranchId: CreateCommitByBranchId
    getStreamBranchByName: GetStreamBranchByName
    getBranchById: GetBranchById
  }): CreateCommitByBranchName =>
  async (params) => {
    const {
      streamId,
      objectId,
      authorId,
      message,
      sourceApplication,
      parents,
      totalChildrenCount,
      createdAt
    } = params
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

    const commit = await deps.createCommitByBranchId({
      streamId,
      branchId: myBranch.id,
      objectId,
      authorId,
      message,
      sourceApplication,
      totalChildrenCount,
      parents,
      createdAt
    })

    return commit
  }

export const isOldVersionUpdateInput = (
  i: CommitUpdateInput | UpdateVersionInput
): i is CommitUpdateInput => has(i, 'streamId')

export const updateCommitAndNotifyFactory =
  (deps: {
    getCommit: GetCommit
    getStream: GetStream
    getCommitStream: GetCommitStream
    getStreamBranchByName: GetStreamBranchByName
    getCommitBranch: GetCommitBranch
    switchCommitBranch: SwitchCommitBranch
    updateCommit: UpdateCommit
    markCommitStreamUpdated: MarkCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
    emitEvent: EventBusEmit
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

    let branch: BranchRecord | undefined = await deps.getCommitBranch(commitId)
    if (newBranchName) {
      try {
        const newBranch = await deps.getStreamBranchByName(streamId, newBranchName)

        if (!newBranch || !branch) {
          throw new BranchNotFoundError("Couldn't resolve branch")
        }
        if (!commit) {
          throw new CommitNotFoundError("Couldn't find commit")
        }

        await deps.switchCommitBranch(commitId, newBranch.id, branch.id)
        branch = newBranch
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
      const [updatedBranch] = await Promise.all([
        deps.markCommitBranchUpdated(commit.id),
        deps.markCommitStreamUpdated(commit.id),
        deps.emitEvent({
          eventName: VersionEvents.Updated,
          payload: {
            projectId: stream.id,
            modelId: branch!.id,
            versionId: commitId,
            newVersion: newCommit,
            oldVersion: commit,
            userId,
            update: params
          }
        })
      ])
      branch = updatedBranch
    }

    return { ...newCommit, streamId: stream.id, branchId: branch!.id }
  }

export const deleteCommitAndNotifyFactory =
  (deps: {
    getCommit: GetCommit
    markCommitStreamUpdated: MarkCommitStreamUpdated
    markCommitBranchUpdated: MarkCommitBranchUpdated
    deleteCommit: DeleteCommit
    emitEvent: EventBusEmit
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
      await deps.emitEvent({
        eventName: VersionEvents.Deleted,
        payload: {
          projectId: streamId,
          modelId: updatedBranch.id,
          versionId: commitId,
          userId,
          version: commit
        }
      })
    }

    return isDeleted
  }
