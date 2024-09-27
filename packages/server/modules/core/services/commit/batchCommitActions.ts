import { db } from '@/db/knex'
import {
  addCommitDeletedActivity,
  addCommitMovedActivity
} from '@/modules/activitystream/services/commitActivity'
import {
  CommitInvalidAccessError,
  CommitBatchUpdateError
} from '@/modules/core/errors/commit'
import {
  CommitsDeleteInput,
  CommitsMoveInput,
  DeleteVersionsInput,
  MoveVersionsInput
} from '@/modules/core/graph/generated/graphql'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  createBranchFactory,
  getStreamBranchByNameFactory
} from '@/modules/core/repositories/branches'
import {
  deleteCommitsFactory,
  getCommitsFactory,
  moveCommitsToBranch
} from '@/modules/core/repositories/commits'
import { getStreams } from '@/modules/core/repositories/streams'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { difference, groupBy, has, keyBy } from 'lodash'

type OldBatchInput = CommitsMoveInput | CommitsDeleteInput
type CommitBatchInput = OldBatchInput | MoveVersionsInput | DeleteVersionsInput

const isOldBatchInput = (i: CommitBatchInput): i is OldBatchInput => has(i, 'commitIds')

/**
 * Do base validation that's going to be appropriate for all batch actions and return
 * the DB entities that were tested
 */
async function validateBatchBaseRules(params: CommitBatchInput, userId: string) {
  const commitIds = isOldBatchInput(params) ? params.commitIds : params.versionIds

  if (!userId) {
    throw new CommitInvalidAccessError(
      'User must be authenticate to operate with commits'
    )
  }
  if (!commitIds?.length) {
    throw new CommitBatchUpdateError('No commits specified')
  }

  const commits = await getCommitsFactory({ db })(commitIds)
  const foundCommitIds = commits.map((c) => c.id)
  if (
    commitIds.length !== foundCommitIds.length ||
    difference(commitIds, foundCommitIds).length > 0
  ) {
    throw new CommitBatchUpdateError('At least one of the commits does not exist')
  }

  const streamGroups = groupBy(commits, (c) => c.streamId)
  const streamIds = Object.keys(streamGroups)
  const streams = await getStreams(streamIds, { userId })

  if (
    streamIds.length !== streams.length ||
    difference(
      streamIds,
      streams.map((s) => s.id)
    ).length > 0
  ) {
    throw new CommitBatchUpdateError("At least one commit stream wasn't found")
  }

  const streamsById = keyBy(streams, (s) => s.id)
  const commitsWithStreams = commits.map((c) => ({
    commit: c,
    stream: streamsById[c.streamId]
  }))

  for (const { commit, stream } of commitsWithStreams) {
    if (stream.role !== Roles.Stream.Owner && commit.author !== userId) {
      throw new CommitInvalidAccessError(
        'To operate on these commits you must either own them or their streams'
      )
    }
  }

  return { commitsWithStreams, commits, streams }
}

/**
 * Validate batch move params
 */
async function validateCommitsMove(
  params: CommitsMoveInput | MoveVersionsInput,
  userId: string
) {
  const targetBranch = isOldBatchInput(params)
    ? params.targetBranch
    : params.targetModelName
  const { streams, commitsWithStreams } = await validateBatchBaseRules(params, userId)

  if (streams.length > 1) {
    throw new CommitBatchUpdateError('Commits belong to different streams')
  }

  const stream = streams[0]
  const branch = await getStreamBranchByNameFactory({ db })(stream.id, targetBranch)

  if (
    !branch &&
    !(<string[]>[Roles.Stream.Contributor, Roles.Stream.Owner]).includes(
      stream.role || ''
    )
  ) {
    throw new CommitBatchUpdateError(
      'Non-existant target branch referenced and active user does not have the rights to create a new one'
    )
  }

  return { stream, branch, commitsWithStreams }
}

/**
 * Validate batch delete params
 */
async function validateCommitsDelete(
  params: CommitsDeleteInput | DeleteVersionsInput,
  userId: string
) {
  return await validateBatchBaseRules(params, userId)
}

/**
 * Move a batch of commits belonging to the same stream to another branch
 */
export async function batchMoveCommits(
  params: CommitsMoveInput | MoveVersionsInput,
  userId: string
) {
  const { commitIds, targetBranch } = isOldBatchInput(params)
    ? params
    : { commitIds: params.versionIds, targetBranch: params.targetModelName }

  const { branch, stream, commitsWithStreams } = await validateCommitsMove(
    params,
    userId
  )

  try {
    const finalBranch =
      branch ||
      (await createBranchFactory({ db })({
        name: targetBranch,
        streamId: stream.id,
        authorId: userId,
        description: null
      }))

    await moveCommitsToBranch(commitIds, finalBranch.id)
    await Promise.all(
      commitsWithStreams.map(({ commit, stream }) =>
        addCommitMovedActivity({
          commitId: commit.id,
          streamId: stream.id,
          userId,
          commit,
          originalBranchId: commit.branchId,
          newBranchId: finalBranch.id
        })
      )
    )
    return finalBranch
  } catch (e) {
    const err = ensureError(e)
    throw new CommitBatchUpdateError('Batch commit move failed', { cause: err })
  }
}

/**
 * Delete a batch of commits
 */
export async function batchDeleteCommits(
  params: CommitsDeleteInput | DeleteVersionsInput,
  userId: string
) {
  const commitIds = isOldBatchInput(params) ? params.commitIds : params.versionIds

  const { commitsWithStreams } = await validateCommitsDelete(params, userId)

  try {
    await deleteCommitsFactory({ db })(commitIds)
    await Promise.all(
      commitsWithStreams.map(({ commit, stream }) =>
        addCommitDeletedActivity({
          commitId: commit.id,
          streamId: stream.id,
          userId,
          commit,
          branchId: commit.branchId
        })
      )
    )
  } catch (e) {
    const err = ensureError(e)
    throw new CommitBatchUpdateError('Batch commit delete failed', { cause: err })
  }
}
