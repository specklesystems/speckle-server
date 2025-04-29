import cryptoRandomString from 'crypto-random-string'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { onProjectCreatedFactory } from '@/modules/workspaces/events/eventListener'
import { expect } from 'chai'
import { GetWorkspaceRolesAndSeats } from '@/modules/gatekeeper/domain/billing'

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
        getWorkspaceRolesAndSeats: async () =>
          workspaceRoles.reduce((acc, role) => {
            acc[role.userId] = { role, seat: null, userId: role.userId }
            return acc
          }, {} as Awaited<ReturnType<GetWorkspaceRolesAndSeats>>),
        getWorkspaceWithPlan: async () =>
          ({
            id: workspaceId
          } as Workspace & { plan: null }),
        getWorkspaceRoleToDefaultProjectRoleMapping: async () => ({
          default: {
            [Roles.Workspace.Admin]: Roles.Stream.Owner,
            [Roles.Workspace.Member]: Roles.Stream.Contributor,
            [Roles.Workspace.Guest]: null
          },
          allowed: {
            [Roles.Workspace.Admin]: [
              Roles.Stream.Owner,
              Roles.Stream.Contributor,
              Roles.Stream.Reviewer
            ],
            [Roles.Workspace.Member]: [
              Roles.Stream.Owner,
              Roles.Stream.Contributor,
              Roles.Stream.Reviewer
            ],
            [Roles.Workspace.Guest]: [Roles.Stream.Reviewer, Roles.Stream.Contributor]
          }
        }),
        upsertProjectRole: async ({ projectId, userId, role }) => {
          projectRoles.push({
            resourceId: projectId,
            userId,
            role
          })

          return {} as StreamRecord
        }
      })

      await onProjectCreated({
        project: { workspaceId, id: projectId } as StreamRecord,
        ownerId: cryptoRandomString({ length: 10 }),
        input: { name: 'test' }
      })

      expect(projectRoles.length).to.equal(2)
    })
  })
})
