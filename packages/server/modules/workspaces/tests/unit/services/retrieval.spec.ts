import { createRandomPassword } from '@/modules/core/helpers/testHelpers'
import { GetWorkspaceRolesCount } from '@/modules/workspaces/domain/operations'
import { getWorkspaceCost } from '@/modules/workspaces/services/retrieval'
import { expect } from 'chai'
import { describe } from 'mocha'

describe('Workspace retrieval services', () => {
  describe('getWorkspaceCost returns a generator, that', () => {
    it('returns 0 with no user in the workspace', async () => {
      const getWorkspaceRolesCount = (() => []) as unknown as GetWorkspaceRolesCount
      expect(
        await getWorkspaceCost({ getWorkspaceRolesCount })({
          workspaceId: createRandomPassword()
        })
      ).to.eq(0)
    })
    it('returns the cost for the workspace', async () => {
      const getWorkspaceRolesCount: GetWorkspaceRolesCount = async () => [
        {
          role: 'workspace:admin',
          count: 1
        },
        {
          role: 'workspace:member',
          count: 2
        },
        {
          role: 'workspace:guest',
          count: 5
        }
      ]
      expect(
        await getWorkspaceCost({ getWorkspaceRolesCount })({
          workspaceId: createRandomPassword()
        })
      ).to.eq(200)
    })
  })
})
