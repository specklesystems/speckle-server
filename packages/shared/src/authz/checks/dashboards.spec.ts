import { describe, expect, it } from 'vitest'
import { isDashboardOwner } from './dashboards.js'
import cryptoRandomString from 'crypto-random-string'

describe('dashboard checks', () => {
  describe('isDashboardOwner returns a function, that', () => {
    it('returns false for dashboard not found', async () => {
      const result = await isDashboardOwner({
        getDashboard: async () => null
      })({
        userId: cryptoRandomString({ length: 9 }),
        dashboardId: cryptoRandomString({ length: 9 })
      })
      expect(result).to.equal(false)
    })
    it('returns false if user not owner', async () => {
      const result = await isDashboardOwner({
        getDashboard: async () => ({
          id: cryptoRandomString({ length: 9 }),
          ownerId: cryptoRandomString({ length: 9 }),
          workspaceId: '',
          projectIds: []
        })
      })({
        userId: cryptoRandomString({ length: 9 }),
        dashboardId: cryptoRandomString({ length: 9 })
      })
      expect(result).to.equal(false)
    })
    it('returns true if user is owner', async () => {
      const userId = cryptoRandomString({ length: 9 })
      const result = await isDashboardOwner({
        getDashboard: async () => ({
          id: cryptoRandomString({ length: 9 }),
          ownerId: userId,
          workspaceId: '',
          projectIds: []
        })
      })({
        userId,
        dashboardId: cryptoRandomString({ length: 9 })
      })
      expect(result).to.equal(true)
    })
  })
})
