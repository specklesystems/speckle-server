import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/utils/isUserLastWorkspaceAdmin'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { expect } from 'chai'
import { Roles } from '@speckle/shared'

describe('given a workspace with several admins', () => {
  const workspaceRoles: WorkspaceAcl[] = [
    { workspaceId: 'workspace-id', userId: 'non-admin', role: Roles.Workspace.Member },
    { workspaceId: 'workspace-id', userId: 'admin-a', role: Roles.Workspace.Admin },
    { workspaceId: 'workspace-id', userId: 'admin-b', role: Roles.Workspace.Admin }
  ]

  describe('when testing a non-admin user', () => {
    it('should return false', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'non-admin')).to.be.false
    })
  })

  describe('when testing an admin user', () => {
    it('should return false', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'admin-a')).to.be.false
    })
  })
})

describe('given a workspace with one admin', () => {
  const workspaceRoles: WorkspaceAcl[] = [
    { workspaceId: 'workspace-id', userId: 'non-admin', role: Roles.Workspace.Member },
    { workspaceId: 'workspace-id', userId: 'admin', role: Roles.Workspace.Admin }
  ]

  describe('when testing a non-admin user', () => {
    it('should return false', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'non-admin')).to.be.false
    })
  })

  describe('when testing an admin user', () => {
    it('should return true', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'admin')).to.be.true
    })
  })
})

describe('given a workspace', () => {
  const workspaceRoles: WorkspaceAcl[] = [
    { workspaceId: 'workspace-id', userId: 'non-admin', role: Roles.Workspace.Member },
    { workspaceId: 'workspace-id', userId: 'admin', role: Roles.Workspace.Admin }
  ]

  describe('when testing a non-workspace user', () => {
    it('should return false', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'random-id')).to.be.false
    })
  })
})
