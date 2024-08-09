import cryptoRandomString from 'crypto-random-string'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { onProjectCreatedFactory } from '@/modules/workspaces/events/eventListener'
import { expect } from 'chai'

describe('Event handlers', () => {
  describe('onProjectCreatedFactory creates a function, that', () => {
    it('grants project roles for all workspace admins and members', async () => {
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

      const onProjectCreated = onProjectCreatedFactory({
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

      await onProjectCreated({
        project: { workspaceId, id: projectId } as StreamRecord
      })

      expect(projectRoles.length).to.equal(2)
    })
  })
})
