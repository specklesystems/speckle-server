import { describe, expect, it } from 'vitest'
import { getDateFromLimitsFactory, hidePropertyIfOutOfLimitFactory } from './utils.js'
import { GetWorkspaceLimits } from '../authz/domain/workspaces/operations.js'
import { createRandomString } from '../tests/helpers/utils.js'
import dayjs from 'dayjs'

describe('Limits utils', () => {
  describe('getDateFromLimits', () => {
    it('should return null if workspace has no versionHistory limits', async () => {
      const getWorkspaceLimits = async () => null
      const workspaceId = createRandomString()

      expect(
        await getDateFromLimitsFactory({
          getWorkspaceLimits,
          environment: { personalProjectsLimitEnabled: false }
        })({ workspaceId })
      ).to.eq(null)
    })
    it('should return date in workspace versionHistory limits', async () => {
      const getWorkspaceLimits = async () => ({
        projectCount: null,
        modelCount: null,
        versionsHistory: { value: 1, unit: 'month' as const }
      })
      const workspaceId = createRandomString()

      expect(
        (
          await getDateFromLimitsFactory({
            getWorkspaceLimits,
            environment: { personalProjectsLimitEnabled: false }
          })({ workspaceId })
        )
          ?.toISOString()
          .slice(-5)
      ).to.eq(dayjs().subtract(1, 'month').toDate().toISOString().slice(-5))
    })
  })
  describe('hidePropertyIfOutOfLimitFactory returns a function that, ', () => {
    it('should return the entity property if project workspace has no limits', async () => {
      const getWorkspaceLimits = (() => null) as unknown as GetWorkspaceLimits
      const workspaceId = createRandomString()
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: new Date()
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: false },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(entity.property)
    })
    it('should return null if entity is outside of workspace limit', async () => {
      const getWorkspaceLimits = (() => ({
        versionsHistory: { value: 7, unit: 'day' }
      })) as unknown as GetWorkspaceLimits
      const workspaceId = createRandomString()
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(new Date().getDate() - 10)
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: tenDaysAgo
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: false },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(null)
    })
    it('should return entity property if version is inside of workspace limit', async () => {
      const getWorkspaceLimits = (() => ({
        versionsHistory: { value: 7, unit: 'day' }
      })) as unknown as GetWorkspaceLimits
      const workspaceId = createRandomString()
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(new Date().getDate() - 2)
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: twoDaysAgo
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: false },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(entity.property)
    })
    it('should return entity property if project is not in a workspace and personalProjectsLimits is not enabled', async () => {
      const getWorkspaceLimits = (() => expect.fail()) as unknown as GetWorkspaceLimits
      const workspaceId = null
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(new Date().getDate() - 10)
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: tenDaysAgo
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: false },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(entity.property)
    })
    it('should return null if project is not in a workspace and personalProjectsLimits is enabled and entity is outside of limits', async () => {
      const getWorkspaceLimits = (() => expect.fail()) as unknown as GetWorkspaceLimits
      const workspaceId = null
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(new Date().getDate() - 10)
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: tenDaysAgo
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: true },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(null)
    })
    it('should return entity property if project is not in a workspace and personalProjectsLimits is enabled and version is inside limits', async () => {
      const getWorkspaceLimits = (() => expect.fail()) as unknown as GetWorkspaceLimits
      const workspaceId = null
      const property = 'property'
      const entity = {
        property: createRandomString(),
        createdAt: new Date()
      }
      expect(
        await hidePropertyIfOutOfLimitFactory({
          environment: { personalProjectsLimitEnabled: true },
          getWorkspaceLimits
        })({ property, entity, workspaceId })
      ).to.eq(entity.property)
    })
  })
})
