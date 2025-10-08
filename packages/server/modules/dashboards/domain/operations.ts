import type { Dashboard } from '@/modules/dashboards/domain/types'
import type { Exact } from 'type-fest'

export type GetDashboardRecord = (args: {
  id: string
}) => Promise<Dashboard | undefined>

export type DeleteDashboardRecord = (args: { id: string }) => Promise<number>

export type UpsertDashboardRecord = <T extends Exact<Dashboard, T>>(
  item: T
) => Promise<void>

export type ListDashboardRecords = (args: {
  workspaceId: string
  filter?: {
    projectIds: string[] | null
    search: string | null
    updatedBefore: string | null
    limit: number | null
  }
}) => Promise<Dashboard[]>

export type CountDashboardRecords = (args: {
  workspaceId: string
  filter?: {
    projectIds: string[] | null
    search: string | null
  }
}) => Promise<number>
