import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import {
  createWorkspaceSeatFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import {
  ensureValidWorkspaceRoleSeatFactory,
  getWorkspaceDefaultSeatTypeFactory
} from '@/modules/workspaces/services/workspaceSeat'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  createTestWorkspace,
  unassignFromWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser, createTestUsers } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { v4 } from 'uuid'

describe('Workspace workspaceSeat services', () => {
  describe('assignWorkspaceSeatFactory', () => {
    const workspaceAdmin: BasicTestUser = {
      id: createRandomString(),
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.Admin,
      verified: true,
      suuid: v4(),
      createdAt: new Date()
    }

    before(async () => {
      await beforeEachContext()
      await createTestUser(workspaceAdmin)
    })

    it('should update seat type on role change', async () => {
      const workspace: BasicTestWorkspace = {
        id: createRandomString(),
        slug: createRandomString(),
        ownerId: workspaceAdmin.id,
        name: cryptoRandomString({ length: 6 }),
        description: cryptoRandomString({ length: 12 })
      }
      await createTestWorkspace(workspace, workspaceAdmin)

      const user: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true,
        suuid: v4(),
        createdAt: new Date()
      }
      await createTestUser(user)

      await assignToWorkspace(workspace, user, Roles.Workspace.Member)
      const workspaceSeat = await db('workspace_seats')
        .where({ userId: user.id, workspaceId: workspace.id })
        .first()

      expect(workspaceSeat.type).to.eq(WorkspaceSeatType.Viewer)

      // Change workspace role
      await assignToWorkspace(workspace, user, Roles.Workspace.Admin)

      const workspaceSeatUpdated = await db('workspace_seats')
        .where({ userId: user.id, workspaceId: workspace.id })
        .first()

      expect(workspaceSeatUpdated.type).to.eq(WorkspaceSeatType.Editor)
    })
  })

  describe('ensureValidWorkspaceRoleSeatFactory', () => {
    const workspaceAdmin: BasicTestUser = {
      id: '',
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.Admin,
      verified: true,
      suuid: v4(),
      createdAt: new Date()
    }
    const testUser: BasicTestUser = {
      id: '',
      name: createRandomString(),
      email: createRandomEmail(),
      role: Roles.Server.User,
      verified: true,
      suuid: v4(),
      createdAt: new Date()
    }
    const workspace: BasicTestWorkspace = {
      ownerId: '',
      id: '',
      slug: '',
      name: cryptoRandomString({ length: 6 }),
      description: cryptoRandomString({ length: 12 })
    }

    before(async () => {
      await createTestUsers([workspaceAdmin, testUser])
      await createTestWorkspace(workspace, workspaceAdmin)
    })

    afterEach(async () => {
      // remove testUsers from workspace
      await unassignFromWorkspace(workspace, testUser)
    })

    const getWorkspaceUserSeat = getWorkspaceUserSeatFactory({ db })
    const createWorkspaceSeat = createWorkspaceSeatFactory({ db })
    const sut = ensureValidWorkspaceRoleSeatFactory({
      createWorkspaceSeat,
      getWorkspaceUserSeat,
      getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
        getWorkspace: getWorkspaceFactory({ db })
      }),
      eventEmit: getEventBus().emit
    })

    it('should create a new seat if none exists', async () => {
      const workspaceSeat = await sut({
        userId: testUser.id,
        workspaceId: workspace.id,
        role: Roles.Workspace.Member,
        updatedByUserId: workspaceAdmin.id
      })

      expect(workspaceSeat).to.be.ok
      expect(workspaceSeat?.type).to.eq(WorkspaceSeatType.Viewer)
    })

    it('should update seat type, if invalid one set', async () => {
      await assignToWorkspace(workspace, testUser, Roles.Workspace.Member)
      const oldSeat = await getWorkspaceUserSeat({
        userId: testUser.id,
        workspaceId: workspace.id
      })

      const workspaceSeat = await sut({
        userId: testUser.id,
        workspaceId: workspace.id,
        role: Roles.Workspace.Admin,
        updatedByUserId: workspaceAdmin.id
      })

      expect(oldSeat?.type).to.eq(WorkspaceSeatType.Viewer)
      expect(workspaceSeat).to.be.ok
      expect(workspaceSeat?.type).to.eq(WorkspaceSeatType.Editor)
    })

    it('should do nothing if valid seat type already exists', async () => {
      await assignToWorkspace(workspace, testUser, Roles.Workspace.Admin)
      const oldSeat = await getWorkspaceUserSeat({
        userId: testUser.id,
        workspaceId: workspace.id
      })

      const workspaceSeat = await sut({
        userId: testUser.id,
        workspaceId: workspace.id,
        role: Roles.Workspace.Admin,
        updatedByUserId: workspaceAdmin.id
      })

      expect(oldSeat?.type).to.eq(WorkspaceSeatType.Editor)
      expect(workspaceSeat).to.be.ok
      expect(workspaceSeat?.type).to.eq(WorkspaceSeatType.Editor)
      expect(workspaceSeat?.updatedAt.toISOString()).to.eq(
        oldSeat?.updatedAt.toISOString()
      )
    })
  })
})
