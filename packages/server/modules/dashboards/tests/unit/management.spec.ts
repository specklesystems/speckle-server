import {
  deleteDashboardFactory,
  updateDashboardFactory
} from '@/modules/dashboards/services/management'
import { DashboardNotFoundError } from '@speckle/shared/authz'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import type { Dashboard } from '@/modules/dashboards/domain/types'
import { assign } from 'lodash-es'
import type { DashboardApiToken } from '@/modules/dashboards/domain/tokens/types'
import type { TokenResourceAccessDefinition } from '@/modules/core/domain/tokens/types'

const buildTestDashboard = (overrides?: Partial<Dashboard>): Dashboard =>
  assign(
    {
      id: cryptoRandomString({ length: 9 }),
      ownerId: '',
      name: 'original-name',
      workspaceId: '',
      projectIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    overrides
  )

const buildTestDashboardToken = (
  overrides?: Partial<DashboardApiToken>
): DashboardApiToken =>
  assign(
    {
      tokenId: cryptoRandomString({ length: 8 }),
      dashboardId: cryptoRandomString({ length: 10 }),
      userId: cryptoRandomString({ length: 10 }),
      content: 'tokencontent',
      createdAt: new Date(),
      lastUsed: new Date(),
      lifespan: 1000,
      revoked: false
    },
    overrides
  )

describe('updateDashboardFactory returns a function, that', () => {
  it('updates and returns the updated dashboard', async () => {
    const dashboardId = cryptoRandomString({ length: 9 })
    const result = await updateDashboardFactory({
      getDashboard: async () => buildTestDashboard({ id: dashboardId }),
      getDashboardTokens: async () => [],
      storeTokenResourceAccessDefinitions: async () => {},
      revokeTokenResourceAccess: async () => {},
      upsertDashboard: async () => {}
    })({
      id: dashboardId,
      name: 'new-name'
    })
    expect(result.name).to.equal('new-name')
  })
  it('throws if dashboard does not exist', async () => {
    const updateDashboard = updateDashboardFactory({
      getDashboard: async () => undefined,
      getDashboardTokens: async () => {
        expect.fail()
      },
      storeTokenResourceAccessDefinitions: async () => {
        expect.fail()
      },
      revokeTokenResourceAccess: async () => {
        expect.fail()
      },
      upsertDashboard: async () => {
        expect.fail()
      }
    })
    expect(updateDashboard({ id: '' })).to.eventually.throw(DashboardNotFoundError)
  })
  it('does not affect tokens if projectIds are not changing', async () => {
    const dashboard = buildTestDashboard()
    const result = await updateDashboardFactory({
      getDashboard: async () => dashboard,
      getDashboardTokens: async () => {
        expect.fail()
      },
      storeTokenResourceAccessDefinitions: async () => {
        expect.fail()
      },
      revokeTokenResourceAccess: async () => {
        expect.fail()
      },
      upsertDashboard: async () => {}
    })({ id: dashboard.id })
    expect(result.projectIds).to.deep.equalInAnyOrder(dashboard.projectIds)
  })
  it('does not add token resource access rules if there are not share tokens', async () => {
    const dashboard = buildTestDashboard()
    const updateDashboard = updateDashboardFactory({
      getDashboard: async () => dashboard,
      getDashboardTokens: async () => {
        return []
      },
      storeTokenResourceAccessDefinitions: async () => {
        expect.fail()
      },
      revokeTokenResourceAccess: async () => {
        expect.fail()
      },
      upsertDashboard: async () => {}
    })
    const updatedPorjectIds = [cryptoRandomString({ length: 10 })]
    const result = await updateDashboard({
      id: dashboard.id,
      projectIds: updatedPorjectIds
    })
    expect(result.projectIds).to.deep.equalInAnyOrder(updatedPorjectIds)
  })
  it('adds new token access rules for new projects for each existing tokens', async () => {
    const dashboard = buildTestDashboard()
    const dashboardTokens = [buildTestDashboardToken({ dashboardId: dashboard.id })]
    const updatePorjectIds = [cryptoRandomString({ length: 10 })]

    const updateDashboard = updateDashboardFactory({
      getDashboard: async () => dashboard,
      getDashboardTokens: async () => dashboardTokens,
      storeTokenResourceAccessDefinitions: async (resourceAccessDefinitions) => {
        expect(resourceAccessDefinitions).to.deep.equalInAnyOrder(
          updatePorjectIds.flatMap((projectId) =>
            dashboardTokens.map((token) => {
              const tokenResourceAccessRecord: TokenResourceAccessDefinition = {
                resourceId: projectId,
                tokenId: token.tokenId,
                resourceType: 'project'
              }
              return tokenResourceAccessRecord
            })
          )
        )
      },
      revokeTokenResourceAccess: async () => {
        expect.fail()
      },
      upsertDashboard: async () => {}
    })
    const result = await updateDashboard({
      id: dashboard.id,
      projectIds: updatePorjectIds
    })
    expect(result.projectIds).to.deep.equalInAnyOrder(updatePorjectIds)
  })
  it('removes token access rules for projects removed from the dashboards for each existing tokens', async () => {
    const dashboard = buildTestDashboard()
    const dashboardTokens = [buildTestDashboardToken({ dashboardId: dashboard.id })]
    const updatePorjectIds = [cryptoRandomString({ length: 10 })]

    const updateDashboard = updateDashboardFactory({
      getDashboard: async () => dashboard,
      getDashboardTokens: async () => dashboardTokens,
      storeTokenResourceAccessDefinitions: async (resourceAccessDefinitions) => {
        expect(resourceAccessDefinitions).to.deep.equalInAnyOrder(
          updatePorjectIds.flatMap((projectId) =>
            dashboardTokens.map((token) => {
              const tokenResourceAccessRecord: TokenResourceAccessDefinition = {
                resourceId: projectId,
                tokenId: token.tokenId,
                resourceType: 'project'
              }
              return tokenResourceAccessRecord
            })
          )
        )
      },
      revokeTokenResourceAccess: async () => {
        expect.fail()
      },
      upsertDashboard: async () => {}
    })
    const result = await updateDashboard({
      id: dashboard.id,
      projectIds: updatePorjectIds
    })
    expect(result.projectIds).to.deep.equalInAnyOrder(updatePorjectIds)
  })
})

describe('deleteDashboardFactory returns a function, that', () => {
  it('throws if dashboard not found', async () => {
    const deleteDashboard = deleteDashboardFactory({
      deleteDashboard: async () => 0
    })
    expect(deleteDashboard({ id: '' })).to.eventually.throw(DashboardNotFoundError)
  })
})
