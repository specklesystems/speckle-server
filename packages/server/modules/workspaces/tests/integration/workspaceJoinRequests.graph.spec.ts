import { db } from '@/db/knex'
import { createRandomString } from '@/modules/core/helpers/testHelpers'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser
} from '@/test/authHelper'
import {
  AdminWorkspaceJoinRequestsDocument,
  RequestToJoinWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import { createTestContext, testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes, Roles } from '@speckle/shared'
import { assert, expect } from 'chai'
import { upsertWorkspaceRoleFactory } from '@/modules/workspaces/repositories/workspaces'

async function login(user: BasicTestUser) {
  const token = await createAuthTokenForUser(user.id, AllScopes)
  return await testApolloServer({
    context: await createTestContext({
      auth: true,
      userId: user.id,
      token,
      role: user.role,
      scopes: AllScopes
    })
  })
}

before(async () => {
  await beforeEachContext()
})

describe('WorkspaceJoinRequests GQL', () => {
  describe('User.adminWorkspacesJoinRequests', () => {
    it('should return the workspace join requests for the admin', async () => {
      const admin = await createTestUser({
        name: 'admin user',
        role: Roles.Server.User
      })

      const user1 = await createTestUser({ name: 'user 1', role: Roles.Server.User })
      const user2 = await createTestUser({ name: 'user 2', role: Roles.Server.User })

      const workspace1 = {
        id: createRandomString(),
        name: 'Workspace 1',
        ownerId: admin.id,
        description: ''
      }
      await createTestWorkspace(workspace1, admin)

      const workspace2 = {
        id: createRandomString(),
        name: 'Workspace 2',
        ownerId: admin.id,
        description: ''
      }
      await createTestWorkspace(workspace2, admin)

      const nobodyWorkspace = {
        id: createRandomString(),
        name: 'nobody',
        ownerId: admin.id,
        description: ''
      }
      await createTestWorkspace(nobodyWorkspace, admin)

      const nonAdminWorkspace = {
        id: createRandomString(),
        name: 'nonadmin',
        ownerId: admin.id,
        description: ''
      }
      await createTestWorkspace(nonAdminWorkspace, admin)
      await upsertWorkspaceRoleFactory({ db })({
        userId: admin.id,
        workspaceId: nonAdminWorkspace.id,
        role: Roles.Workspace.Member,
        createdAt: new Date()
      })

      // User1 requests to join workspace1
      const sessionUser1 = await login(user1)
      const joinReq1 = await sessionUser1.execute(RequestToJoinWorkspaceDocument, {
        input: {
          workspaceId: workspace1.id
        }
      })
      expect(joinReq1).to.not.haveGraphQLErrors()

      // User2 requests to join workspace2
      const sessionUser2 = await login(user2)
      const joinReq2 = await sessionUser2.execute(RequestToJoinWorkspaceDocument, {
        input: {
          workspaceId: workspace2.id
        }
      })
      expect(joinReq2).to.not.haveGraphQLErrors()

      const sessionAdmin = await login(admin)
      const res = await sessionAdmin.execute(AdminWorkspaceJoinRequestsDocument, {})
      expect(res).to.not.haveGraphQLErrors()

      const { items, totalCount } = res.data?.adminWorkspacesJoinRequests

      expect(totalCount).to.equal(2)

      expect(items).to.have.length(2)
      assert.deepEqual(items[1], {
        status: 'pending',
        user: { id: user1.id, name: user1.name },
        workspace: { id: workspace1.id, name: workspace1.name },
        createdAt: items[1].createdAt
      })
      assert.deepEqual(items[0], {
        status: 'pending',
        user: { id: user2.id, name: user2.name },
        workspace: { id: workspace2.id, name: workspace2.name },
        createdAt: items[0].createdAt
      })
    })
  })
})
