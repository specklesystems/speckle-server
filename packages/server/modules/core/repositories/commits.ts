import {
  BranchCommits,
  Branches,
  Commits,
  StreamCommits,
  Streams
} from '@/modules/core/dbSchema'
import {
  BranchCommitRecord,
  CommitRecord,
  StreamCommitRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { keyBy, uniqBy } from 'lodash'

const CommitWithStreamBranchMetadataFields = [
  ...Commits.cols,
  StreamCommits.col.streamId,
  BranchCommits.col.branchId,
  `${Branches.col.name} as branchName`
]
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'

export const generateCommitId = () => crs({ length: 10 })

export type CommitWithStreamBranchMetadata = CommitRecord & {
  streamId: string
  branchId: string
  branchName: string
}

/**
 * Get commit associated streams. Results are streams keyed by commit IDs
 */
export async function getCommitStreams(commitIds: string[]) {
  const q = Commits.knex()
    .select<Array<StreamRecord & { commitId: string }>>([
      ...Streams.cols,
      `${Commits.col.id} as commitId`
    ])
    .whereIn(Commits.col.id, commitIds)
    .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
    .innerJoin(Streams.name, Streams.col.id, StreamCommits.col.streamId)

  const results = await q
  return keyBy(results, (r) => r.commitId)
}

/**
 * Get commits with their stream and branch IDs
 */
export async function getCommits(commitIds: string[]) {
  const q = Commits.knex()
    .select<CommitWithStreamBranchMetadata[]>(CommitWithStreamBranchMetadataFields)
    .whereIn(Commits.col.id, commitIds)
    .leftJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
    .leftJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
    .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)

  const rows = await q

  // in case the join tables have multiple values for each commit
  // (shouldnt happen, but the schema allows for it)
  const uniqueRows = uniqBy(rows, (r) => r.id)

  return uniqueRows
}

/**
 * Move all commits to the specified branch
 * Note: Make sure to validate beforehand that the branch ID belongs to the
 * same stream etc. THIS DOESN'T DO ANY VALIDATION!
 * @returns The amount of commits that were moved
 */
export async function moveCommitsToBranch(commitIds: string[], branchId: string) {
  if (!commitIds?.length) return

  // delete old branch commits
  await BranchCommits.knex().whereIn(BranchCommits.col.commitId, commitIds).del()

  // insert new ones
  const inserts = await BranchCommits.knex().insert(
    commitIds.map(
      (cId): BranchCommitRecord => ({
        branchId,
        commitId: cId
      })
    ),
    '*'
  )

  return inserts.length
}

export async function deleteCommits(commitIds: string[]) {
  return await Commits.knex().whereIn(Commits.col.id, commitIds).del()
}

export function getBatchedStreamCommits(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Commits.knex<CommitRecord[]>()
    .select<CommitRecord[]>(Commits.cols)
    .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
    .where(StreamCommits.col.streamId, streamId)
    .orderBy(Commits.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export function getBatchedBranchCommits(
  branchIds: string[],
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = BranchCommits.knex<BranchCommitRecord[]>()
    .whereIn(BranchCommits.col.branchId, branchIds)
    .orderBy(BranchCommits.col.branchId)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertCommits(commits: CommitRecord[]) {
  return await Commits.knex().insert(commits)
}

export async function insertStreamCommits(streamCommits: StreamCommitRecord[]) {
  return await StreamCommits.knex().insert(streamCommits)
}

export async function insertBranchCommits(branchCommits: BranchCommitRecord[]) {
  return await BranchCommits.knex().insert(branchCommits)
}
