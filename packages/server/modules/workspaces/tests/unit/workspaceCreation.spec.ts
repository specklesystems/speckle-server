import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { createWorkspaceFactory } from '@/modules/workspaces/services/workspaceCreation'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

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
        event: '',
        payload: {}
      }
      const createWorkspace = createWorkspaceFactory({
        storeWorkspace: async () => {},
        upsertWorkspaceRole: async () => {},
        emitWorkspaceEvent: async ({ event, payload }) => {
          eventData.isCalled = true
          eventData.event = event
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
      expect(eventData.event).to.equal('created')
      expect(eventData.payload).to.deep.equal(workspace)
    })
  })
})
