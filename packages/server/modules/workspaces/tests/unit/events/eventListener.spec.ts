import cryptoRandomString from 'crypto-random-string'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles, StreamRoles } from '@speckle/shared'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import {
  onProjectCreatedFactory,
  onWorkspaceRoleUpdatedFactory
} from '@/modules/workspaces/events/eventListener'
import { expect } from 'chai'
import { chunk } from 'lodash'
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
  describe('onWorkspaceRoleUpdatedFactory creates a function, that', () => {
    it('assigns no project roles if the role mapping returns null', async () => {
      let isDeleteCalled = false
      const fakeProject = { id: 'test' } as StreamRecord

      await onWorkspaceRoleUpdatedFactory({
        getWorkspaceWithPlan: async () =>
          ({
            id: 'fake'
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
        async *queryAllWorkspaceProjects() {
          yield [fakeProject as StreamRecord]
        },
        getStreamsCollaboratorCounts: async () => {
          return {}
        },
        setStreamCollaborator: async ({ role }) => {
          if (!role) {
            isDeleteCalled = true
          } else {
            expect.fail()
          }

          return fakeProject
        }
      })({
        acl: {
          role: Roles.Workspace.Guest,
          userId: cryptoRandomString({ length: 10 }),
          workspaceId: cryptoRandomString({ length: 10 })
        },
        updatedByUserId: cryptoRandomString({ length: 10 })
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
        getWorkspaceWithPlan: async () =>
          ({
            id: 'fake'
          } as Workspace & { plan: null }),
        getWorkspaceRoleToDefaultProjectRoleMapping: async () => ({
          default: {
            [Roles.Workspace.Admin]: Roles.Stream.Owner,
            [Roles.Workspace.Member]: projectRole,
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
        async *queryAllWorkspaceProjects() {
          for (const projIds of chunk(projectIds, 3)) {
            yield projIds.map((projId) => ({ id: projId } as unknown as StreamRecord))
          }
        },
        getStreamsCollaboratorCounts: async () => {
          return {}
        },
        setStreamCollaborator: async (params, options) => {
          if (!params.role) {
            return expect.fail()
          } else {
            storedRoles.push({
              userId: params.userId,
              role: params.role,
              projectId: params.streamId
            })
            trackProjectUpdate = trackProjectUpdate || options?.trackProjectUpdate
            return {} as StreamRecord
          }
        }
      })({
        acl: {
          role: Roles.Workspace.Member,
          userId,
          workspaceId: cryptoRandomString({ length: 10 })
        },
        updatedByUserId: cryptoRandomString({ length: 10 })
      })
      expect(storedRoles).deep.equals(
        projectIds.map((projectId) => ({ projectId, role: projectRole, userId }))
      )
      expect(trackProjectUpdate).to.not.be.true
    })
  })
})
