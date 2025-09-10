import type { DashboardApiTokenRecord } from '@/modules/dashboards/domain/tokens/types'
import type { Exact } from 'type-fest'

export type StoreDashboardApiToken = <T extends Exact<DashboardApiTokenRecord, T>>(
  token: T
) => Promise<DashboardApiTokenRecord>
