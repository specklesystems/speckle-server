import { describe, expect, it } from 'vitest'
import {
  calculateLimitCutoffDate,
  getProjectLimitDateFactory,
  isCreatedBeyondHistoryLimitCutoffFactory
} from './utils.js'
import dayjs from 'dayjs'

describe('Limits utils', () => {
  describe('calculateLimitCutoffDate', () => {
    it('returns null if historyLimits is null', () => {
      const cutoffDate = calculateLimitCutoffDate(null, 'commentHistory')
      expect(cutoffDate).toBeNull()
    })
    it('returns null if limitType is null on the historyLimit', () => {
      const cutoffDate = calculateLimitCutoffDate(
        { commentHistory: { value: 1, unit: 'day' }, versionsHistory: null },
        'versionsHistory'
      )
      expect(cutoffDate).toBeNull()
    })
    it('returns cutoff date from limits', () => {
      const cutoffDate = calculateLimitCutoffDate(
        { commentHistory: { value: 1, unit: 'day' }, versionsHistory: null },
        'commentHistory'
      )
      const now = dayjs()
      expect(now.diff(cutoffDate, 'days')).to.equal(1)
    })
  })
  describe('getProjectLimitDate', () => {
    it('returns workspaceLimits for workspace projects', async () => {
      const cutoffDate = await getProjectLimitDateFactory({
        getPersonalProjectLimits: () => {
          expect.fail()
        },
        getWorkspaceLimits: async () => null
      })({ limitType: 'commentHistory', project: { workspaceId: 'asdfg12345' } })
      expect(cutoffDate).toBeNull()
    })
    it('returns projectLimits for non workspaceProjects', async () => {
      const cutoffDate = await getProjectLimitDateFactory({
        getPersonalProjectLimits: async () => null,
        getWorkspaceLimits: async () => {
          expect.fail()
        }
      })({ limitType: 'commentHistory', project: { workspaceId: null } })
      expect(cutoffDate).toBeNull()
    })
  })
  describe('isCreatedBeyondHistoryLimitCutoff', () => {
    it('returns false if there are no limits', async () => {
      const isCreatedBeyondHistoryLimit =
        await isCreatedBeyondHistoryLimitCutoffFactory({
          getProjectLimitDate: async () => null
        })({
          entity: { createdAt: new Date() },
          limitType: 'commentHistory',
          project: { workspaceId: null }
        })
      expect(isCreatedBeyondHistoryLimit).to.be.toBeFalsy()
    })
    it('returns false if entity is newer than the limit cutoff date', async () => {
      const isCreatedBeyondHistoryLimit =
        await isCreatedBeyondHistoryLimitCutoffFactory({
          getProjectLimitDate: async () => new Date(1999)
        })({
          entity: { createdAt: new Date() },
          limitType: 'commentHistory',
          project: { workspaceId: null }
        })
      expect(isCreatedBeyondHistoryLimit).to.be.toBeFalsy()
    })
    it('returns false if entity is right on the limit cutoff date', async () => {
      const date = new Date()
      const isCreatedBeyondHistoryLimit =
        await isCreatedBeyondHistoryLimitCutoffFactory({
          getProjectLimitDate: async () => date
        })({
          entity: { createdAt: date },
          limitType: 'commentHistory',
          project: { workspaceId: null }
        })
      expect(isCreatedBeyondHistoryLimit).to.be.toBeFalsy()
    })
  })
  it('returns true of entity is older than the limit cutoff date', async () => {
    const date = new Date()
    const isCreatedBeyondHistoryLimit = await isCreatedBeyondHistoryLimitCutoffFactory({
      getProjectLimitDate: async () => date
    })({
      entity: { createdAt: new Date(1999) },
      limitType: 'commentHistory',
      project: { workspaceId: null }
    })
    expect(isCreatedBeyondHistoryLimit).to.be.toBeTruthy()
  })
})
