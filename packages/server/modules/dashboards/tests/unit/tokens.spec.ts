import type { ApiTokenRecord } from '@/modules/auth/repositories'
import type { DashboardApiTokenRecord } from '@/modules/dashboards/domain/tokens/types'
import { DashboardMalformedTokenError } from '@/modules/dashboards/errors/dashboards'
import { createDashboardTokenFactory } from '@/modules/dashboards/services/tokens'
import { DashboardNotFoundError } from '@speckle/shared/authz'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('createDashboardTokenFactory returns a function, that', () => {
  it('returns a token associated with the given dashboard', async () => {
    const dashboardId = cryptoRandomString({ length: 9 })
    const userId = cryptoRandomString({ length: 9 })
    const createDashboardToken = createDashboardTokenFactory({
      getDashboard: async () => ({
        id: dashboardId,
        ownerId: userId,
        workspaceId: cryptoRandomString({ length: 9 }),
        name: cryptoRandomString({ length: 9 }),
        projectIds: [cryptoRandomString({ length: 9 })],
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      createToken: async () => ({
        id: cryptoRandomString({ length: 10 }),
        token: cryptoRandomString({ length: 20 })
      }),
      getToken: async () => ({} as ApiTokenRecord),
      storeDashboardApiToken: async () => ({} as DashboardApiTokenRecord)
    })
    const result = await createDashboardToken({ dashboardId, userId })
    expect(result.tokenMetadata.dashboardId).to.equal(dashboardId)
  })
  it('throws if dashboard not found', async () => {
    const dashboardId = cryptoRandomString({ length: 9 })
    const userId = cryptoRandomString({ length: 9 })
    const createDashboardToken = createDashboardTokenFactory({
      getDashboard: async () => undefined,
      createToken: async () => {
        expect.fail()
      },
      getToken: async () => {
        expect.fail()
      },
      storeDashboardApiToken: async () => {
        expect.fail()
      }
    })
    expect(createDashboardToken({ dashboardId, userId })).to.eventually.throw(
      DashboardNotFoundError
    )
  })
  it('throws if dashboard not associated with any projects', async () => {
    const dashboardId = cryptoRandomString({ length: 9 })
    const userId = cryptoRandomString({ length: 9 })
    const createDashboardToken = createDashboardTokenFactory({
      getDashboard: async () => ({
        id: dashboardId,
        ownerId: userId,
        workspaceId: cryptoRandomString({ length: 9 }),
        name: cryptoRandomString({ length: 9 }),
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      createToken: async () => {
        expect.fail()
      },
      getToken: async () => {
        expect.fail()
      },
      storeDashboardApiToken: async () => {
        expect.fail()
      }
    })
    expect(createDashboardToken({ dashboardId, userId })).to.eventually.throw(
      DashboardMalformedTokenError
    )
  })
})
