import type { ApiTokenRecord } from '@/modules/auth/repositories'
import { ApiTokens } from '@/modules/core/dbSchema'
import { DashboardApiTokens } from '@/modules/dashboards/dbSchema'
import type {
  DeleteDashboardToken,
  StoreDashboardApiToken
} from '@/modules/dashboards/domain/tokens/operations'
import type { DashboardApiTokenRecord } from '@/modules/dashboards/domain/tokens/types'
import type { Knex } from 'knex'

const tables = {
  apiTokens: (db: Knex) => db<ApiTokenRecord>(ApiTokens.name),
  dashboardApiTokens: (db: Knex) => db<DashboardApiTokenRecord>(DashboardApiTokens.name)
}

export const storeDashboardApiTokenFactory =
  (deps: { db: Knex }): StoreDashboardApiToken =>
  async (token) => {
    const [newToken] = await tables
      .dashboardApiTokens(deps.db)
      .insert(token)
      .returning('*')
    return newToken
  }

export const deleteDashboardApiTokenFactory =
  (deps: { db: Knex }): DeleteDashboardToken =>
  async ({ tokenId }) => {
    const [deletedToken] = await tables
      .dashboardApiTokens(deps.db)
      .where({ tokenId })
      .del()
      .returning('*')
    return deletedToken
  }
