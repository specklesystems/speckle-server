import cryptoRandomString from 'crypto-random-string'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { onProjectCreatedFactory } from '@/modules/workspaces/events/eventListener'
import { expect } from 'chai'

describe('Event handlers', () => {
  describe('onProjectCreatedFactory creates a function, that', () => {
    it('grants project roles for all workspace members, except guests', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const workspaceRoles: WorkspaceAcl[] = [
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Admin,
          createdAt: new Date()
        },
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Member,
          createdAt: new Date()
        },
        {
          workspaceId,
          userId: cryptoRandomString({ length: 10 }),
          role: Roles.Workspace.Guest,
          createdAt: new Date()
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
