import {
  deleteDashboardFactory,
  updateDashboardFactory
} from '@/modules/dashboards/services/management'
import { DashboardNotFoundError } from '@speckle/shared/authz'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('updateDashboardFactory returns a function, that', () => {
  it('updates and returns the updated dashboard', async () => {
    const dashboardId = cryptoRandomString({ length: 9 })
    const result = await updateDashboardFactory({
      getDashboard: async () => ({
        id: dashboardId,
        ownerId: '',
        name: 'original-name',
        workspaceId: '',
        projectIds: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }),
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
      upsertDashboard: async () => {
        expect.fail()
      }
    })
    expect(updateDashboard({ id: '' })).to.eventually.throw(DashboardNotFoundError)
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
