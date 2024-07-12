import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
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
        }
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
        getWorkspaceRoles: async () => storedRoles,
        upsertWorkspaceRole: async (role) => {
          storedRoles.push(role)
        },
        emitWorkspaceEvent: async () => []
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
        }
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
        emitWorkspaceEvent: async () => []
      })

      await expectToThrow(() =>
        setWorkspaceRole({ ...role, role: Roles.Workspace.Member })
      )
    })
  })
})
