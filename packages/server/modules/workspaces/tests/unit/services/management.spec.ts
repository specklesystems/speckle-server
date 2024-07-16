import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import {
  createWorkspaceFactory,
  deleteWorkspaceRoleFactory,
  setWorkspaceRoleFactory
} from '@/modules/workspaces/services/management'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { expectToThrow } from '@/test/assertionHelper'

describe('Workspace services', () => {
  describe('createWorkspaceFactory creates a function, that', () => {
    it('stores the workspace', async () => {
      const storedWorkspaces: Workspace[] = []
      const createWorkspace = createWorkspaceFactory({
        upsertWorkspace: async ({ workspace }: { workspace: Workspace }) => {
          storedWorkspaces.push(workspace)
        },
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async () => [],
        storeBlob: async () => cryptoRandomString({ length: 10 })
      })

      const workspaceInput = {
        description: 'foobar',
        logo: null,
        name: cryptoRandomString({ length: 6 })
      }
      const workspace = await createWorkspace({
        userId: cryptoRandomString({ length: 10 }),
        workspaceInput
      })
      expect(storedWorkspaces.length).to.equal(1)
      expect(storedWorkspaces[0]).to.deep.equal(workspace)
    })
    it('makes the workspace creator becomes a workspace:admin', async () => {
      const storedRole: WorkspaceAcl[] = []
      const createWorkspace = createWorkspaceFactory({
        upsertWorkspace: async () => {},
        upsertWorkspaceRole: async (workspaceAcl: WorkspaceAcl) => {
          storedRole.push(workspaceAcl)
        },
        emitWorkspaceEvent: async () => [],
        storeBlob: async () => cryptoRandomString({ length: 10 })
      })

      const workspaceInput = {
        description: 'foobar',
        logo: null,
        name: cryptoRandomString({ length: 6 })
      }
      const userId = cryptoRandomString({ length: 10 })
      const workspace = await createWorkspace({
        userId,
        workspaceInput
      })
      expect(storedRole.length).to.equal(1)
      expect(storedRole[0]).to.deep.equal({
        userId,
        workspaceId: workspace.id,
        role: Roles.Workspace.Admin
      })
    })
    it('emits a workspace created event', async () => {
      const eventData = {
        isCalled: false,
        eventName: '',
        payload: {}
      }
      const createWorkspace = createWorkspaceFactory({
        upsertWorkspace: async () => {},
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async ({ eventName, payload }) => {
          eventData.isCalled = true
          eventData.eventName = eventName
          eventData.payload = payload
          return []
        },
        storeBlob: async () => cryptoRandomString({ length: 10 })
      })

      const workspaceInput = {
        description: 'foobar',
        logo: null,
        name: cryptoRandomString({ length: 6 })
      }
      const userId = cryptoRandomString({ length: 10 })

      const workspace = await createWorkspace({
        userId,
        workspaceInput
      })

      expect(eventData.isCalled).to.equal(true)
      expect(eventData.eventName).to.equal(WorkspaceEvents.Created)
      expect(eventData.payload).to.deep.equal({ ...workspace, createdByUserId: userId })
    })
  })
})

describe('Workspace role services', () => {
  describe('deleteWorkspaceRoleFactory creates a function, that', () => {
    it('deletes the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      let storedRoles: WorkspaceAcl[] = [role]

      const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
        getWorkspaceRoles: async () => storedRoles,
        deleteWorkspaceRole: async ({ userId, workspaceId }) => {
          const role = storedRoles.find(
            (r) => r.userId === userId && r.workspaceId === workspaceId
          )

          storedRoles = storedRoles.filter((r) => r.userId !== userId)

          return role ?? null
        },
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({ streams: [], totalCount: 0, cursorDate: null }),
        revokeStreamPermissions: async () => ({} as StreamRecord)
      })

      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

      expect(storedRoles.length).to.equal(0)
      expect(deletedRole).to.deep.equal(role)
    })
    it('emits a role-deleted event', async () => {
      const eventData = {
        isCalled: false,
        eventName: '',
        payload: {}
      }

      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const storedRoles: WorkspaceAcl[] = [role]

      const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
        getWorkspaceRoles: async () => storedRoles,
        deleteWorkspaceRole: async () => {
          return storedRoles[0]
        },
        emitWorkspaceEvent: async ({ eventName, payload }) => {
          eventData.isCalled = true
          eventData.eventName = eventName
          eventData.payload = payload

          return []
        },
        getStreams: async () => ({ streams: [], totalCount: 0, cursorDate: null }),
        revokeStreamPermissions: async () => ({} as StreamRecord)
      })

      await deleteWorkspaceRole({ userId, workspaceId })

      expect(eventData.isCalled).to.be.true
      expect(eventData.eventName).to.equal(WorkspaceEvents.RoleDeleted)
      expect(eventData.payload).to.deep.equal(role)
    })
    it('throws if attempting to delete the last admin from a workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Admin }

      let storedRoles: WorkspaceAcl[] = [role]

      const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
        getWorkspaceRoles: async () => storedRoles,
        deleteWorkspaceRole: async ({ userId, workspaceId }) => {
          const role = storedRoles.find(
            (r) => r.userId === userId && r.workspaceId === workspaceId
          )

          storedRoles = storedRoles.filter((r) => r.userId !== userId)

          return role ?? null
        },
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({ streams: [], totalCount: 0, cursorDate: null }),
        revokeStreamPermissions: async () => ({} as StreamRecord)
      })

      await expectToThrow(() => deleteWorkspaceRole({ userId, workspaceId }))
    })
    it('deletes workspace project roles', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const workspaceRole: WorkspaceAcl = {
        userId,
        workspaceId,
        role: Roles.Workspace.Member
      }
      const workspaceRoles: WorkspaceAcl[] = [workspaceRole]
      const workspaceProjects: StreamRecord[] = [{ id: projectId } as StreamRecord]

      let projectRoles: StreamAclRecord[] = [
        { userId, role: Roles.Stream.Contributor, resourceId: projectId }
      ]

      const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
        getWorkspaceRoles: async () => workspaceRoles,
        deleteWorkspaceRole: async () => ({} as WorkspaceAcl),
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({
          streams: workspaceProjects,
          totalCount: workspaceProjects.length,
          cursorDate: null
        }),
        revokeStreamPermissions: async ({ streamId, userId }) => {
          projectRoles = projectRoles.filter(
            (role) => role.resourceId !== streamId && role.userId !== userId
          )
          return {} as StreamRecord
        }
      })

      await deleteWorkspaceRole({ userId, workspaceId })

      expect(projectRoles.length).to.equal(0)
    })
  })

  describe('setWorkspaceRoleFactory creates a function, that', () => {
    it('sets the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const storedRoles: WorkspaceAcl[] = []

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceRoles: async () => storedRoles,
        upsertWorkspaceRole: async (role) => {
          storedRoles.push(role)
        },
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({ streams: [], totalCount: 0, cursorDate: null }),
        grantStreamPermissions: async () => ({} as StreamRecord)
      })

      await setWorkspaceRole(role)

      expect(storedRoles.length).to.equal(1)
      expect(storedRoles[0]).to.deep.equal(role)
    })
    it('emits a role-updated event', async () => {
      const eventData = {
        isCalled: false,
        eventName: '',
        payload: {}
      }

      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceRoles: async () => [],
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async ({ eventName, payload }) => {
          eventData.isCalled = true
          eventData.eventName = eventName
          eventData.payload = payload

          return []
        },
        getStreams: async () => ({ streams: [], totalCount: 0, cursorDate: null }),
        grantStreamPermissions: async () => ({} as StreamRecord)
      })

      await setWorkspaceRole(role)

      expect(eventData.isCalled).to.be.true
      expect(eventData.eventName).to.equal(WorkspaceEvents.RoleUpdated)
      expect(eventData.payload).to.deep.equal(role)
    })
    it('throws if attempting to remove the last admin in a workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Admin }

      const storedRoles: WorkspaceAcl[] = [role]

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceRoles: async () => storedRoles,
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({ streams: [], totalCount: 0, cursor: null }),
        grantStreamPermissions: async () => ({} as StreamRecord)
      })

      await expectToThrow(() =>
        setWorkspaceRole({ ...role, role: Roles.Workspace.Member })
      )
    })
    it('sets roles on workspace projects', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const workspaceRole: WorkspaceAcl = {
        userId,
        workspaceId,
        role: Roles.Workspace.Admin
      }
      const workspaceRoles: WorkspaceAcl[] = []
      const workspaceProjects: StreamRecord[] = [{ id: projectId } as StreamRecord]

      const projectRoles: StreamAclRecord[] = []

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceRoles: async () => workspaceRoles,
        upsertWorkspaceRole: async (role) => {
          workspaceRoles.push(role)
        },
        emitWorkspaceEvent: async () => [],
        getStreams: async () => ({
          streams: workspaceProjects,
          totalCount: workspaceProjects.length,
          cursorDate: null
        }),
        grantStreamPermissions: async (role) => {
          projectRoles.push({ ...role, resourceId: role.streamId })
          return {} as StreamRecord
        }
      })

      await setWorkspaceRole(workspaceRole)

      expect(projectRoles.length).to.equal(1)
      expect(projectRoles[0].userId).to.equal(userId)
      expect(projectRoles[0].resourceId).to.equal(projectId)
      expect(projectRoles[0].role).to.equal(Roles.Stream.Owner)
    })
  })
})
