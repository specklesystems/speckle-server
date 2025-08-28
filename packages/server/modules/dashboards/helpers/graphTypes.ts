import type { MutationsObjectGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import type { DashboardApiToken } from '@/modules/dashboards/domain/tokens/types'
import type { Dashboard } from '@/modules/dashboards/domain/types'

export type DashboardGraphQLReturn = Dashboard
export type DashboardMutationsGraphQLReturn = MutationsObjectGraphQLReturn
export type DashboardPermissionChecksGraphQLReturn = { dashboardId: string }
export type DashboardTokenGraphQLReturn = DashboardApiToken
