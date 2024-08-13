import { WorkspaceInvalidRoleError } from '@/modules/workspaces/errors/workspace'
import {
  WORKSPACE_ADMIN_COST,
  WORKSPACE_GUEST_COST,
  WORKSPACE_MEMBER_COST,
  getCostByWorkspaceRole
} from '@/modules/workspaces/helpers/cost'
import { expectToThrow } from '@/test/assertionHelper'
import { WorkspaceRoles } from '@speckle/shared'
import { expect } from 'chai'
import { describe, it } from 'mocha'

describe('Workspace helpers, cost', () => {
  describe('getCostByWorkspaceRole', () => {
    it('should throw an error with unknown role', async () => {
      const err = await expectToThrow(() =>
        getCostByWorkspaceRole('invalid:role' as unknown as WorkspaceRoles)
      )

      expect(err.name).to.eq(new WorkspaceInvalidRoleError().name)
    })
    it('should return the correct cost for workspace:admin role', async () => {
      expect(getCostByWorkspaceRole('workspace:admin')).to.eq(WORKSPACE_ADMIN_COST)
    })
    it('should return the correct cost for workspace:member role', async () => {
      expect(getCostByWorkspaceRole('workspace:member')).to.eq(WORKSPACE_MEMBER_COST)
    })
    it('should return the correct cost for workspace:guest role', async () => {
      expect(getCostByWorkspaceRole('workspace:guest')).to.eq(WORKSPACE_GUEST_COST)
    })
  })
})
