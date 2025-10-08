import { Dashboards } from '@/modules/dashboards/dbSchema'
import type {
  CountDashboardRecords,
  DeleteDashboardRecord,
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
      .select('*')
      .where(Dashboards.col.id, id)
      .first()
  }

export const deleteDashboardRecordFactory =
  (deps: { db: Knex }): DeleteDashboardRecord =>
  async ({ id }) => {
    return await tables.dashboards(deps.db).where(Dashboards.col.id, id).delete()
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
  async ({ workspaceId, filter }) => {
    const q = tables
      .dashboards(deps.db)
      .select()
      .where(Dashboards.col.workspaceId, workspaceId)
      .orderBy(Dashboards.col.updatedAt, 'desc')

    if (filter?.limit) {
      q.limit(filter.limit)
    }

    if (filter?.updatedBefore) {
      q.andWhere(Dashboards.col.updatedAt, '<', filter.updatedBefore)
    }

    if (filter?.projectIds?.length) {
      q.andWhereRaw('?? && ?', [Dashboards.col.projectIds, filter.projectIds])
    }

    if (filter?.search) {
      q.andWhereILike(Dashboards.col.name, filter.search)
    }

    return await q
  }

export const countDashboardsFactory =
  (deps: { db: Knex }): CountDashboardRecords =>
  async ({ workspaceId, filter = {} }) => {
    const { projectIds, search } = filter

    const q = tables.dashboards(deps.db).where(Dashboards.col.workspaceId, workspaceId)

    if (projectIds?.length) {
      q.andWhereRaw('?? && ?', [Dashboards.col.projectIds, projectIds])
    }

    if (search) {
      q.andWhereILike(Dashboards.col.name, search)
    }

    const [{ count }] = await q.count()

    return Number.parseInt(count as string)
  }
