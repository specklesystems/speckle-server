import type {
  CountDashboardRecords,
  DeleteDashboardRecord,
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
import type { GetDashboardTokens } from '@/modules/dashboards/domain/tokens/operations'
import type {
  RevokeTokenResourceAccess,
  StoreTokenResourceAccessDefinitions
} from '@/modules/core/domain/tokens/operations'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { clamp } from 'lodash-es'

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
    getDashboardTokens: GetDashboardTokens
    storeTokenResourceAccessDefinitions: StoreTokenResourceAccessDefinitions
    revokeTokenResourceAccess: RevokeTokenResourceAccess
    upsertDashboard: UpsertDashboardRecord
  }): UpdateDashboard =>
  async ({ id, ...update }) => {
    const dashboard = await deps.getDashboard({ id })

    if (!dashboard) {
      throw new DashboardNotFoundError()
    }

    const newProjectIds = [
      ...new Set(update.projectIds).difference(new Set(dashboard.projectIds))
    ]

    const deletedProjectIds = [
      ...new Set(dashboard.projectIds).difference(new Set(update.projectIds))
    ]

    const projectIdsChanged = newProjectIds.length || deletedProjectIds.length

    if (projectIdsChanged) {
      const dashboardTokens = await deps.getDashboardTokens({
        dashboardId: dashboard.id
      })
      if (newProjectIds.length && dashboardTokens.length) {
        const newResourceAccessRules = dashboardTokens.flatMap((t) =>
          newProjectIds.map((p) => ({
            resourceId: p,
            tokenId: t.tokenId,
            resourceType: TokenResourceIdentifierType.Project
          }))
        )
        await deps.storeTokenResourceAccessDefinitions(newResourceAccessRules)
      }
      if (deletedProjectIds.length && dashboardTokens.length) {
        await Promise.all(
          // i know this is bad and sending more than one delete requests
          // but most of the time there are only a couple of projects deleted at max from dashboards
          dashboardTokens.flatMap((t) =>
            deletedProjectIds.map((p) =>
              deps.revokeTokenResourceAccess({
                resourceId: p,
                resourceType: TokenResourceIdentifierType.Project,
                tokenId: t.tokenId
              })
            )
          )
        )
      }
    }

    const nextDashboard: Dashboard = {
      ...dashboard,
      ...update,
      updatedAt: new Date(),
      id
    }

    await deps.upsertDashboard(nextDashboard)

    return nextDashboard
  }

export type DeleteDashboard = (params: { id: string }) => Promise<void>

export const deleteDashboardFactory =
  (deps: { deleteDashboard: DeleteDashboardRecord }): DeleteDashboard =>
  async ({ id }) => {
    const itemCount = await deps.deleteDashboard({ id })

    if (itemCount === 0) {
      throw new DashboardNotFoundError()
    }
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
    projectIds: string[] | null
    search: string | null
  }
}) => Promise<Collection<Dashboard>>

export const getPaginatedDashboardsFactory =
  (deps: {
    listDashboards: ListDashboardRecords
    countDashboards: CountDashboardRecords
  }): GetPaginatedDashboards =>
  async ({ workspaceId, filter }) => {
    const cursor = filter?.cursor ? decodeIsoDateCursor(filter.cursor) : null
    const projectIds = filter?.projectIds ?? []
    const search = filter?.search ?? null

    const [items, totalCount] = await Promise.all([
      deps.listDashboards({
        workspaceId,
        filter: {
          updatedBefore: cursor,
          limit: clamp(filter?.limit ?? 50, 1, 200),
          projectIds,
          search
        }
      }),
      deps.countDashboards({
        workspaceId,
        filter: {
          projectIds,
          search
        }
      })
    ])

    const lastItem = items.at(-1)

    return {
      items,
      totalCount,
      cursor: lastItem ? encodeIsoDateCursor(lastItem.updatedAt) : null
    }
  }
