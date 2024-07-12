import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { grantWorkspaceProjectRolesFactory } from '@/modules/workspaces/services/workspaceProjectRoleCreation'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Workspace project role services', () => {
  describe('grantWorkspaceProjectRolesFactory creates a function, that', () => {
    it('grants project roles for all workspace members', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const workspaceRoles: WorkspaceAcl[] = [
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Admin
        },
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Member
        },
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Guest
        }
      ]

      const projectRoles: StreamAclRecord[] = []

      const grantWorkspaceProjectRoles = grantWorkspaceProjectRolesFactory({
        getWorkspaceRoles: async () => workspaceRoles,
        grantStreamPermissions: async ({ streamId, userId, role }) => {
          projectRoles.push({
            resourceId: streamId,
            userId,
            role
          })

          return {} as StreamRecord
        }
      })

      await grantWorkspaceProjectRoles({ workspaceId, projectId })

      expect(projectRoles.length).to.equal(3)
    })
  })
})
