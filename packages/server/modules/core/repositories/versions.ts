import { BranchCommits, knex, Branches, Commits } from '@/modules/core/dbSchema'
import type { Version } from '@/modules/core/domain/commits/types'
import type { Knex } from 'knex'
import { groupBy } from 'lodash-es'

export const getLastVersionsByProjectIdFactory =
  ({ db }: { db: Knex }) =>
  async ({
    projectIds
  }: {
    projectIds: readonly string[]
  }): Promise<Record<string, Array<Version & { projectId: string }>>> => {
    const res = await db(Branches.name)
      .whereIn(Branches.col.streamId, projectIds)
      .join(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
      .join(Commits.name, Commits.col.id, BranchCommits.col.commitId)
      .distinctOn(Branches.col.id)
      .select([...Commits.cols, knex.raw(`branches."streamId" as "projectId"`)])
      .orderBy([
        { column: Branches.col.id, order: 'desc' },
        { column: Commits.col.createdAt, order: 'desc' },
        { column: Commits.col.id, order: 'desc' }
      ])

    return groupBy(res, 'projectId')
  }
