import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { expect } from 'chai'
import { Roles } from '@speckle/shared'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/helpers/roles'

describe('given a workspace with several admins', () => {
  const workspaceRoles: Omit<WorkspaceAcl, 'createdAt'>[] = [
    {
      workspaceId: 'workspace-id',
      userId: 'non-admin',
      role: Roles.Workspace.Member
    },
    {
      workspaceId: 'workspace-id',
      userId: 'admin-a',
      role: Roles.Workspace.Admin
    },
    {
      workspaceId: 'workspace-id',
      userId: 'admin-b',
      role: Roles.Workspace.Admin
    }
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
  const workspaceRoles: Omit<WorkspaceAcl, 'createdAt'>[] = [
    {
      workspaceId: 'workspace-id',
      userId: 'non-admin',
      role: Roles.Workspace.Member
    },
    {
      workspaceId: 'workspace-id',
      userId: 'admin',
      role: Roles.Workspace.Admin
    }
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
  const workspaceRoles: Omit<WorkspaceAcl, 'createdAt'>[] = [
    {
      workspaceId: 'workspace-id',
      userId: 'non-admin',
      role: Roles.Workspace.Member
    },
    {
      workspaceId: 'workspace-id',
      userId: 'admin',
      role: Roles.Workspace.Admin
    }
  ]

  describe('when testing a non-workspace user', () => {
    it('should return false', () => {
      expect(isUserLastWorkspaceAdmin(workspaceRoles, 'random-id')).to.be.false
    })
  })
})
