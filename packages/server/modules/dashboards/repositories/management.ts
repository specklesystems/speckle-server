import { Dashboards } from '@/modules/dashboards/dbSchema'
import type {
  CountDashboardRecords,
  GetDashboardRecord,
  ListDashboardRecords,
  UpsertDashboardRecord
} from '@/modules/dashboards/domain/operations'
import type { Dashboard } from '@/modules/dashboards/domain/types'
import type { Knex } from 'knex'

const tables = {
  dashboards: (db: Knex) => db.table<Dashboard>(Dashboards.name)
}

export const getDashboardRecordFactory =
  (deps: { db: Knex }): GetDashboardRecord =>
  async ({ id }) => {
    return await tables
      .dashboards(deps.db)
      .select()
      .where(Dashboards.col.id, id)
      .first()
  }

export const upsertDashboardFactory =
  (deps: { db: Knex }): UpsertDashboardRecord =>
  async (item) => {
    await tables
      .dashboards(deps.db)
      .insert(item)
      .onConflict(Dashboards.withoutTablePrefix.col.id)
      .merge([
        Dashboards.withoutTablePrefix.col.name,
        Dashboards.withoutTablePrefix.col.projectIds,
        Dashboards.withoutTablePrefix.col.state,
        Dashboards.withoutTablePrefix.col.updatedAt
      ] as (keyof Dashboard)[])
  }

export const listDashboardsFactory =
  (deps: { db: Knex }): ListDashboardRecords =>
  async ({ workspaceId }) => {
    return await tables
      .dashboards(deps.db)
      .select()
      .where(Dashboards.col.workspaceId, workspaceId)
      .orderBy(Dashboards.col.updatedAt, 'desc')
  }

export const countDashboardsFactory =
  (deps: { db: Knex }): CountDashboardRecords =>
  async ({ workspaceId }) => {
    const [{ count }] = await tables
      .dashboards(deps.db)
      .where(Dashboards.col.workspaceId, workspaceId)
      .count()
    return Number.parseInt(count as string)
  }
