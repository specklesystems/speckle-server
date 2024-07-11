import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  deleteWorkspaceRoleFactory,
  setWorkspaceRoleFactory
} from '@/modules/workspaces/services/workspaceRoleCreation'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { expectToThrow } from '@/test/assertionHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

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
        emitWorkspaceEvent: async () => []
      })

      const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

      expect(storedRoles.length).to.equal(0)
      expect(deletedRole).to.deep.equal(role)
    })
    it('emits a role-deleted event', async () => {
      const eventData = {
        isCalled: false,
        event: '',
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
        emitWorkspaceEvent: async ({ event, payload }) => {
          eventData.isCalled = true
          eventData.event = event
          eventData.payload = payload

          return []
        }
      })

      await deleteWorkspaceRole({ userId, workspaceId })

      expect(eventData.isCalled).to.be.true
      expect(eventData.event).to.equal(WorkspaceEvents.RoleDeleted)
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
        emitWorkspaceEvent: async () => []
      })

      await expectToThrow(() => deleteWorkspaceRole({ userId, workspaceId }))
    })
  })

  describe('setWorkspaceRoleFactory creates a function, that', () => {
    it('sets the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const storedRoles: WorkspaceAcl[] = []

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceProjects: async () => [],
        getWorkspaceRoles: async () => storedRoles,
        upsertWorkspaceRole: async (role) => {
          storedRoles.push(role)
        },
        emitWorkspaceEvent: async () => [],
        grantStreamPermissions: async () => ({} as StreamRecord)
      })

      await setWorkspaceRole(role)

      expect(storedRoles.length).to.equal(1)
      expect(storedRoles[0]).to.deep.equal(role)
    })
    it('emits a role-updated event', async () => {
      const eventData = {
        isCalled: false,
        event: '',
        payload: {}
      }

      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceProjects: async () => [],
        getWorkspaceRoles: async () => [],
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async ({ event, payload }) => {
          eventData.isCalled = true
          eventData.event = event
          eventData.payload = payload

          return []
        },
        grantStreamPermissions: async () => ({} as StreamRecord)
      })

      await setWorkspaceRole(role)

      expect(eventData.isCalled).to.be.true
      expect(eventData.event).to.equal(WorkspaceEvents.RoleUpdated)
      expect(eventData.payload).to.deep.equal(role)
    })
    it('throws if attempting to remove the last admin in a workspace', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Admin }

      const storedRoles: WorkspaceAcl[] = [role]

      const setWorkspaceRole = setWorkspaceRoleFactory({
        getWorkspaceProjects: async () => [],
        getWorkspaceRoles: async () => storedRoles,
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async () => [],
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
        getWorkspaceProjects: async () => workspaceProjects,
        getWorkspaceRoles: async () => workspaceRoles,
        upsertWorkspaceRole: async (role) => {
          workspaceRoles.push(role)
        },
        emitWorkspaceEvent: async () => [],
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
