import type {
  CreateAndStoreUserToken,
  GetApiTokenById
} from '@/modules/core/domain/tokens/operations'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import type { GetDashboardRecord } from '@/modules/dashboards/domain/operations'
import type { StoreDashboardApiToken } from '@/modules/dashboards/domain/tokens/operations'
import type {
  DashboardApiToken,
  DashboardApiTokenRecord
} from '@/modules/dashboards/domain/tokens/types'
import {
  DashboardMalformedTokenError,
  DashboardNotFoundError
} from '@/modules/dashboards/errors/dashboards'
import { LogicError } from '@/modules/shared/errors'
import { Scopes } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { pick } from 'lodash-es'

export type CreateAndStoreDashboardToken = (args: {
  dashboardId: string
  userId: string
  lifespan?: number | bigint
}) => Promise<{
  token: string
  tokenMetadata: DashboardApiToken
}>

export const createDashboardTokenFactory =
  (deps: {
    getDashboard: GetDashboardRecord
    createToken: CreateAndStoreUserToken
    getToken: GetApiTokenById
    storeDashboardApiToken: StoreDashboardApiToken
  }): CreateAndStoreDashboardToken =>
  async ({ dashboardId, userId, lifespan }) => {
    const dashboard = await deps.getDashboard({ id: dashboardId })

    if (!dashboard) {
      throw new DashboardNotFoundError()
    }

    if (dashboard.projectIds.length === 0) {
      throw new DashboardMalformedTokenError()
    }

    const { id, token } = await deps.createToken({
      userId,
      name: `dat-${cryptoRandomString({ length: 10 })}`,
      scopes: [Scopes.Streams.Read, Scopes.Users.Read, Scopes.Workspaces.Read],
      limitResources: dashboard.projectIds.map((id) => ({
        id,
        type: TokenResourceIdentifierType.Project
      })),
      lifespan
    })

    const tokenMetadata: DashboardApiTokenRecord = {
      userId,
      dashboardId,
      tokenId: id,
      content: token
    }

    await deps.storeDashboardApiToken(tokenMetadata)

    const apiToken = await deps.getToken(id)

    if (!apiToken) {
      throw new LogicError('Failed to create api token for dashboard')
    }

    return {
      token,
      tokenMetadata: {
        ...tokenMetadata,
        ...pick(apiToken, 'createdAt', 'lastUsed', 'lifespan')
      }
    }
  }
