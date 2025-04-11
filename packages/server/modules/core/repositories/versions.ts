import { Commits, knex, StreamCommits } from '@/modules/core/dbSchema'
import { Version } from '@/modules/core/domain/commits/types'
import { Knex } from 'knex'

const tables = {
  versions: (db: Knex) => db<Version>(Commits.name)
}

export const getLastVersionByProjectIdFactory =
  ({ db }: { db: Knex }) =>
  async ({
    projectIds
  }: {
    projectIds: readonly string[]
  }): Promise<Record<string, Version & { projectId: string }>> => {
    const results = await tables
      .versions(db)
      .join(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .whereIn(StreamCommits.col.streamId, projectIds)
      .distinctOn(StreamCommits.col.streamId)
      .select([...Commits.cols, knex.raw(`stream_commits."streamId" as "projectId"`)])
      .orderBy([
        { column: StreamCommits.col.streamId, order: 'desc' },
        { column: Commits.col.createdAt, order: 'desc' }
      ])

    return results.reduce<Record<string, Version & { projectId: string }>>(
      (acc, curr) => ({ ...acc, [curr.projectId]: curr }),
      {}
    )
  }
