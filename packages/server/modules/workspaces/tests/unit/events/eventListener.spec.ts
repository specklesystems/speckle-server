import cryptoRandomString from 'crypto-random-string'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles, StreamRoles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import {
  onProjectCreatedFactory,
  onWorkspaceRoleUpdatedFactory
} from '@/modules/workspaces/events/eventListener'
import { expect } from 'chai'
import { chunk } from 'lodash'
import {
  GetWorkspaceRolesAndSeats,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'

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

      // TODO: New plan support
      const onProjectCreated = onProjectCreatedFactory({
        getWorkspaceRolesAndSeats: async () =>
          workspaceRoles.reduce((acc, role) => {
            acc[role.userId] = { role, seat: null, userId: role.userId }
            return acc
          }, {} as Awaited<ReturnType<GetWorkspaceRolesAndSeats>>),
        getWorkspaceRolesAllowedProjectRoles: async () => {
          const mapping = {
            [Roles.Workspace.Admin]: Roles.Stream.Owner,
            [Roles.Workspace.Member]: Roles.Stream.Contributor,
            [Roles.Workspace.Guest]: null
          }
          return {
            defaultProjectRole: ({ workspaceRole }) => {
              return mapping[workspaceRole]
            },
            allowedProjectRoles: ({ workspaceRole }) => {
              return [mapping[workspaceRole] || Roles.Stream.Reviewer]
            }
          }
        },
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
  describe('onWorkspaceRoleUpdatedFactory creates a function, that', () => {
    it('assigns no project roles if the role mapping returns null', async () => {
      let isDeleteCalled = false

      await onWorkspaceRoleUpdatedFactory({
        getWorkspaceRolesAllowedProjectRoles: async () => {
          const mapping = {
            [Roles.Workspace.Admin]: Roles.Stream.Owner,
            [Roles.Workspace.Member]: Roles.Stream.Contributor,
            [Roles.Workspace.Guest]: null
          }
          return {
            defaultProjectRole: ({ workspaceRole }) => {
              return mapping[workspaceRole]
            },
            allowedProjectRoles: ({ workspaceRole }) => {
              return [mapping[workspaceRole] || Roles.Stream.Reviewer]
            }
          }
        },
        async *queryAllWorkspaceProjects() {
          yield [{ id: 'test' } as StreamRecord]
        },
        deleteProjectRole: async () => {
          isDeleteCalled = true
          return undefined
        },
        upsertProjectRole: async () => {
          expect.fail()
        }
      })({
        acl: {
          role: Roles.Workspace.Guest,
          userId: cryptoRandomString({ length: 10 }),
          workspaceId: cryptoRandomString({ length: 10 })
        },
        seatType: WorkspaceSeatType.Editor
      })

      expect(isDeleteCalled).to.be.true
    })
    it('assigns the mapped projects roles to all queried project', async () => {
      const projectIds = [
        cryptoRandomString({ length: 10 }),
        cryptoRandomString({ length: 10 }),
        cryptoRandomString({ length: 10 }),
        cryptoRandomString({ length: 10 })
      ]
      const userId = cryptoRandomString({ length: 10 })
      const projectRole = Roles.Stream.Reviewer

      const storedRoles: { userId: string; role: StreamRoles; projectId: string }[] = []
      let trackProjectUpdate: boolean | undefined = false
      await onWorkspaceRoleUpdatedFactory({
        getWorkspaceRolesAllowedProjectRoles: async () => {
          const mapping = {
            [Roles.Workspace.Admin]: Roles.Stream.Owner,
            [Roles.Workspace.Member]: projectRole,
            [Roles.Workspace.Guest]: null
          }
          return {
            defaultProjectRole: ({ workspaceRole }) => {
              return mapping[workspaceRole]
            },
            allowedProjectRoles: ({ workspaceRole }) => {
              return [mapping[workspaceRole] || Roles.Stream.Reviewer]
            }
          }
        },
        async *queryAllWorkspaceProjects() {
          for (const projIds of chunk(projectIds, 3)) {
            yield projIds.map((projId) => ({ id: projId } as unknown as StreamRecord))
          }
        },
        deleteProjectRole: async () => {
          expect.fail()
        },
        upsertProjectRole: async (args, options) => {
          storedRoles.push(args)
          trackProjectUpdate = trackProjectUpdate || options?.trackProjectUpdate
          return {} as StreamRecord
        }
      })({
        acl: {
          role: Roles.Workspace.Member,
          userId,
          workspaceId: cryptoRandomString({ length: 10 })
        },
        seatType: WorkspaceSeatType.Editor
      })
      expect(storedRoles).deep.equals(
        projectIds.map((projectId) => ({ projectId, role: projectRole, userId }))
      )
      expect(trackProjectUpdate).to.not.be.true
    })
  })
})
