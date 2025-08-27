import type {
  CountDashboardRecords,
  GetDashboardRecord,
  ListDashboardRecords,
  UpsertDashboardRecord
} from '@/modules/dashboards/domain/operations'
import type { Dashboard } from '@/modules/dashboards/domain/types'
import { DashboardNotFoundError } from '@/modules/dashboards/errors/dashboards'
import type { Collection } from '@/modules/shared/helpers/dbHelper'
import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/dbHelper'
import cryptoRandomString from 'crypto-random-string'

export type CreateDashboard = (params: {
  name: string
  workspaceId: string
  ownerId: string
}) => Promise<Dashboard>

export const createDashboardFactory =
  (deps: { upsertDashboard: UpsertDashboardRecord }): CreateDashboard =>
    async ({ name, workspaceId, ownerId }) => {
      const dashboard: Dashboard = {
        id: cryptoRandomString({ length: 9 }),
        name,
        workspaceId,
        ownerId,
        projectIds: [],
        state: '[]',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      await deps.upsertDashboard(dashboard)

      return dashboard
    }

export type UpdateDashboard = (params: {
  id: string
  name?: string
  projectIds?: string[]
  state?: string
}) => Promise<Dashboard>

export const updateDashboardFactory =
  (deps: {
    getDashboard: GetDashboardRecord
    upsertDashboard: UpsertDashboardRecord
  }): UpdateDashboard =>
    async ({ id, ...update }) => {
      const dashboard = await deps.getDashboard({ id })

      if (!dashboard) {
        throw new DashboardNotFoundError()
      }

      const nextDashboard: Dashboard = {
        ...dashboard,
        ...update,
        id
      }

      await deps.upsertDashboard(nextDashboard)

      return nextDashboard
    }

export type GetDashboard = (params: { id: string }) => Promise<Dashboard>

export const getDashboardFactory =
  (deps: { getDashboard: GetDashboardRecord }): GetDashboard =>
    async ({ id }) => {
      const dashboard = await deps.getDashboard({ id })

      if (!dashboard) {
        throw new DashboardNotFoundError()
      }

      return dashboard
    }

export type GetPaginatedDashboards = (params: {
  workspaceId: string
  filter?: {
    limit: number | null
    cursor: string | null
  }
}) => Promise<Collection<Dashboard>>

export const getPaginatedDasboardsFactory =
  (deps: {
    listDashboards: ListDashboardRecords
    countDashboards: CountDashboardRecords
  }): GetPaginatedDashboards =>
    async ({ workspaceId, filter }) => {
      const cursor = filter?.cursor ? decodeIsoDateCursor(filter.cursor) : null

      const [items, totalCount] = await Promise.all([
        deps.listDashboards({
          workspaceId,
          filter: {
            updatedBefore: cursor,
            limit: filter?.limit ?? null
          }
        }),
        deps.countDashboards({ workspaceId })
      ])

      const lastItem = items.at(-1)

      return {
        items,
        totalCount,
        cursor: lastItem ? encodeIsoDateCursor(lastItem.updatedAt) : null
      }
    }
