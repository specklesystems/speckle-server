import { isWorkspaceRoleWorkspaceSeatTypeValid } from '@/modules/workspaces/services/workspaceSeat'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Workspace workspaceSeat services', () => {
  describe('isWorkspaceRoleWorkspaceSeatTypeValid', () => {
    it('should return true if the role is admin and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Admin,
        workspaceSeatType: 'editor'
      })
      expect(result).to.be.true
    })
    it('should return false if the role is admin and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Admin,
        workspaceSeatType: 'viewer' as 'editor'
      })
      expect(result).to.be.false
    })
    it('should return true if the role is member and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Member,
        workspaceSeatType: 'editor'
      })
      expect(result).to.be.true
    })
    it('should return true if the role is member and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Member,
        workspaceSeatType: 'viewer'
      })
      expect(result).to.be.true
    })
    it('should return true if the role is guest and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Guest,
        workspaceSeatType: 'editor'
      })
      expect(result).to.be.true
    })
    it('should return true if the role is member and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Guest,
        workspaceSeatType: 'viewer'
      })
      expect(result).to.be.true
    })
  })
})
