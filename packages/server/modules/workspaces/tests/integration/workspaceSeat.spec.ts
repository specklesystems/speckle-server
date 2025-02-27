import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { createWorkspaceSeatFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { NotFoundError } from '@/modules/shared/errors'
import { InvalidWorkspaceSeatType } from '@/modules/workspaces/errors/workspaceSeat'
import { getWorkspaceRoleForUserFactory } from '@/modules/workspaces/repositories/workspaces'
import { assignWorkspaceSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { expectToThrow } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Workspace workspaceSeat services', () => {
  describe('assignWorkspaceSeatFactory', () => {
    it('should throw an error if user is not a member of the workspace', async () => {
      const workspaceAdmin: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.Admin,
        verified: true
      }
      await createTestUser(workspaceAdmin)

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
        verified: true
      }
      await createTestUser(user)

      const err = await expectToThrow(() =>
        assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db })
        })({ userId: user.id, workspaceId: workspace.id, type: 'editor' })
      )

      expect(err.name).to.eq(NotFoundError.name)
    })
    it('should assign a workspace seat with the default type if none is provided', async () => {
      const workspaceAdmin: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.Admin,
        verified: true
      }
      await createTestUser(workspaceAdmin)

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
        verified: true
      }
      await createTestUser(user)

      await assignToWorkspace(workspace, user, Roles.Workspace.Member)

      await assignWorkspaceSeatFactory({
        createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
        getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db })
      })({ userId: user.id, workspaceId: workspace.id })

      const workspaceSeat = await db('workspace_seats')
        .where({ userId: user.id, workspaceId: workspace.id })
        .first()

      expect(workspaceSeat.type).to.eq('viewer')
    })
    it('should assign a workspace seat with the provided type', async () => {
      const workspaceAdmin: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.Admin,
        verified: true
      }
      await createTestUser(workspaceAdmin)

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
        verified: true
      }
      await createTestUser(user)

      await assignToWorkspace(workspace, user, Roles.Workspace.Member)

      await assignWorkspaceSeatFactory({
        createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
        getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db })
      })({ userId: user.id, workspaceId: workspace.id, type: 'editor' })

      const workspaceSeat = await db('workspace_seats')
        .where({ userId: user.id, workspaceId: workspace.id })
        .first()

      expect(workspaceSeat.type).to.eq('editor')
    })
    it('should throw an error if seat type is not compatible with workspace role', async () => {
      const workspaceAdmin: BasicTestUser = {
        id: createRandomString(),
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.Admin,
        verified: true
      }
      await createTestUser(workspaceAdmin)

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
        verified: true
      }
      await createTestUser(user)

      await assignToWorkspace(workspace, user, Roles.Workspace.Admin)

      const err = await expectToThrow(() =>
        assignWorkspaceSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db })
        })({ userId: user.id, workspaceId: workspace.id, type: 'viewer' })
      )

      expect(err.name).to.eq(InvalidWorkspaceSeatType.name)
    })
  })
})
