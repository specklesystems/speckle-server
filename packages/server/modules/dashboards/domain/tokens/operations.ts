import type { DashboardApiTokenRecord } from '@/modules/dashboards/domain/tokens/types'
import type { Exact } from 'type-fest'

export type StoreDashboardApiToken = <T extends Exact<DashboardApiTokenRecord, T>>(
  token: T
) => Promise<DashboardApiTokenRecord>

export type DeleteDashboardToken = (args: {
  tokenId: string
}) => Promise<DashboardApiTokenRecord | null>

export type GetDashboardTokens = (args: {
  dashboardId: string
}) => Promise<DashboardApiTokenRecord[]>

// export type GetDashboardApiToken = (id: string) => Promise<DashboardApiToken>
