import {
  CommitInvalidAccessError,
  CommitBatchUpdateError
} from '@/modules/core/errors/commit'
import {
  CommitsDeleteInput,
  CommitsMoveInput
} from '@/modules/core/graph/generated/graphql'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import {
  deleteCommits,
  getCommits,
  moveCommitsToBranch
} from '@/modules/core/repositories/commits'
import { getStreams } from '@/modules/core/repositories/streams'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { difference, groupBy, keyBy } from 'lodash'

type CommitBatchInput = CommitsMoveInput | CommitsDeleteInput

/**
 * Do base validation that's going to be appropriate for all batch actions and return
 * the DB entities that were tested
 */
async function validateBatchBaseRules(params: CommitBatchInput, userId: string) {
  const { commitIds } = params

  if (!userId) {
    throw new CommitInvalidAccessError(
      'User must be authenticate to operate with commits'
    )
  }
  if (!commitIds?.length) {
    throw new CommitBatchUpdateError('No commits specified')
  }

  const commits = await getCommits(commitIds)
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
async function validateCommitsMove(params: CommitsMoveInput, userId: string) {
  const { targetBranch } = params
  const { streams } = await validateBatchBaseRules(params, userId)

  if (streams.length > 1) {
    throw new CommitBatchUpdateError('Commits belong to different streams')
  }

  const stream = streams[0]
  const branch = await getStreamBranchByName(stream.id, targetBranch)
  if (!branch) {
    throw new CommitBatchUpdateError('Invalid target branch')
  }

  return { stream, branch }
}

/**
 * Validate batch delete params
 */
async function validateCommitsDelete(params: CommitsDeleteInput, userId: string) {
  await validateBatchBaseRules(params, userId)
}

/**
 * Move a batch of commits belonging to the same stream to another branch
 */
export async function batchMoveCommits(params: CommitsMoveInput, userId: string) {
  const { commitIds } = params

  const { branch } = await validateCommitsMove(params, userId)

  try {
    await moveCommitsToBranch(commitIds, branch.id)
  } catch (e) {
    const err = ensureError(e)
    throw new CommitBatchUpdateError('Batch commit move failed', { cause: err })
  }
}

/**
 * Delete a batch of commits
 */
export async function batchDeleteCommits(params: CommitsDeleteInput, userId: string) {
  const { commitIds } = params

  await validateCommitsDelete(params, userId)

  try {
    await deleteCommits(commitIds)
  } catch (e) {
    const err = ensureError(e)
    throw new CommitBatchUpdateError('Batch commit delete failed', { cause: err })
  }
}
