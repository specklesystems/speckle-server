import { isWorkspaceRoleWorkspaceSeatTypeValid } from '@/modules/workspaces/services/workspaceSeat'
import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Workspace workspaceSeat services', () => {
  describe('isWorkspaceRoleWorkspaceSeatTypeValid', () => {
    it('should return true if the role is admin and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Admin,
        workspaceSeatType: WorkspaceSeatType.Editor
      })
      expect(result).to.be.true
    })
    it('should return false if the role is admin and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Admin,
        workspaceSeatType: WorkspaceSeatType.Viewer as typeof WorkspaceSeatType.Editor
      })
      expect(result).to.be.false
    })
    it('should return true if the role is member and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Member,
        workspaceSeatType: WorkspaceSeatType.Editor
      })
      expect(result).to.be.true
    })
    it('should return true if the role is member and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Member,
        workspaceSeatType: WorkspaceSeatType.Viewer
      })
      expect(result).to.be.true
    })
    it('should return true if the role is guest and seat type is editor', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Guest,
        workspaceSeatType: WorkspaceSeatType.Editor
      })
      expect(result).to.be.true
    })
    it('should return true if the role is member and seat type is viewer', () => {
      const result = isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: Roles.Workspace.Guest,
        workspaceSeatType: WorkspaceSeatType.Viewer
      })
      expect(result).to.be.true
    })
  })
  describe('getWorkspaceDefaultSeatType', () => {
    it('returns the global default if not set on workspace', () => {})
    it('overrides the global default if user is workspace admin', () => {})
    it('returns the value set on the workspace', () => {})
    it('overrides the value set on the workspace if user is workspace admin', () => {})
  })
})
