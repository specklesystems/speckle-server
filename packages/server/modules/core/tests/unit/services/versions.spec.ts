import { createRandomString } from '@/modules/core/helpers/testHelpers'
import { getLimitedReferencedObjectFactory } from '@/modules/core/services/versions/limits'
import { GetWorkspaceLimits } from '@speckle/shared/dist/commonjs/authz/domain/workspaces/operations'
import { expect } from 'chai'

describe('Module @core', () => {
  describe('Services versions', () => {
    describe('getLimitedReferencedObjectFactory returns a function that, ', () => {
      it('should return the version referencedObject if project workspace has no limits', async () => {
        const getWorkspaceLimits = (() => null) as unknown as GetWorkspaceLimits
        const project = { workspaceId: createRandomString() }
        const version = {
          referencedObject: createRandomString(),
          createdAt: new Date()
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: false },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(version.referencedObject)
      })
      it('should return null if version is outside of workspace limit', async () => {
        const getWorkspaceLimits = (() => ({
          versionsHistory: { value: 1, unit: 'week' }
        })) as unknown as GetWorkspaceLimits
        const project = { workspaceId: createRandomString() }
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(new Date().getDate() - 10)
        const version = {
          referencedObject: createRandomString(),
          createdAt: tenDaysAgo
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: false },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(null)
      })
      it('should return version referencedObject if version is inside of workspace limit', async () => {
        const getWorkspaceLimits = (() => ({
          versionsHistory: { value: 1, unit: 'week' }
        })) as unknown as GetWorkspaceLimits
        const project = { workspaceId: createRandomString() }
        const twoDaysAgo = new Date()
        twoDaysAgo.setDate(new Date().getDate() - 2)
        const version = {
          referencedObject: createRandomString(),
          createdAt: twoDaysAgo
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: false },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(version.referencedObject)
      })
      it('should return version referencedObject if project is not in a workspace and personalProjectsLimits is not enabled', async () => {
        const getWorkspaceLimits = (() =>
          expect.fail()) as unknown as GetWorkspaceLimits
        const project = { workspaceId: null }
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(new Date().getDate() - 10)
        const version = {
          referencedObject: createRandomString(),
          createdAt: tenDaysAgo
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: false },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(version.referencedObject)
      })
      it('should return null if project is not in a workspace and personalProjectsLimits is enabled and version is outside of limits', async () => {
        const getWorkspaceLimits = (() =>
          expect.fail()) as unknown as GetWorkspaceLimits
        const project = { workspaceId: null }
        const tenDaysAgo = new Date()
        tenDaysAgo.setDate(new Date().getDate() - 10)
        const version = {
          referencedObject: createRandomString(),
          createdAt: tenDaysAgo
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: true },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(null)
      })
      it('should return version referencedObject if project is not in a workspace and personalProjectsLimits is enabled and version is inside limits', async () => {
        const getWorkspaceLimits = (() =>
          expect.fail()) as unknown as GetWorkspaceLimits
        const project = { workspaceId: null }
        const version = {
          referencedObject: createRandomString(),
          createdAt: new Date()
        }
        expect(
          await getLimitedReferencedObjectFactory({
            environment: { personalProjectsLimitEnabled: true },
            getWorkspaceLimits
          })({ version, project })
        ).to.eq(version.referencedObject)
      })
    })
  })
})
