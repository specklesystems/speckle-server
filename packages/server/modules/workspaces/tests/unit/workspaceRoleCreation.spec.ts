import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import {
  deleteWorkspaceRoleFactory,
  setWorkspaceRoleFactory
} from '@/modules/workspaces/services/workspaceRoleCreation'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
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
  })

  describe('setWorkspaceRoleFactory creates a function, that', () => {
    it('sets the workspace role', async () => {
      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const storedRoles: WorkspaceAcl[] = []

      const setWorkspaceRole = setWorkspaceRoleFactory({
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
        event: '',
        payload: {}
      }

      const userId = cryptoRandomString({ length: 10 })
      const workspaceId = cryptoRandomString({ length: 10 })

      const role: WorkspaceAcl = { userId, workspaceId, role: Roles.Workspace.Member }

      const setWorkspaceRole = setWorkspaceRoleFactory({
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async ({ event, payload }) => {
          eventData.isCalled = true
          eventData.event = event
          eventData.payload = payload

          return []
        }
      })

      await setWorkspaceRole(role)

      expect(eventData.isCalled).to.be.true
      expect(eventData.event).to.equal(WorkspaceEvents.RoleUpdated)
      expect(eventData.payload).to.deep.equal(role)
    })
  })
})
