import { db } from '@/db/knex'
import { createRandomString } from '@/modules/core/helpers/testHelpers'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser
} from '@/test/authHelper'
import {
  GetWorkspaceWithJoinRequestsDocument,
  RequestToJoinWorkspaceDocument
} from '@/test/graphql/generated/graphql'
import { createTestContext, testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes, Roles } from '@speckle/shared'
import { expect } from 'chai'
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
  describe('Workspace.adminWorkspacesJoinRequests', () => {
    it('should return the workspace join requests for the admin', async () => {
      const admin = await createTestUser({
        name: 'admin user',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      })

      const user1 = await createTestUser({
        name: 'user 1',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      })
      const user2 = await createTestUser({
        name: 'user 2',
        role: Roles.Server.User,
        email: `${createRandomString()}@example.org`,
        verified: true
      })

      const workspace1 = {
        id: createRandomString(),
        name: 'Workspace 1',
        ownerId: admin.id,
        description: '',
        discoverabilityEnabled: true
      }
      await createTestWorkspace(workspace1, admin, { domain: 'example.org' })

      const workspace2 = {
        id: createRandomString(),
        name: 'Workspace 2',
        ownerId: admin.id,
        description: '',
        discoverabilityEnabled: true
      }
      await createTestWorkspace(workspace2, admin, { domain: 'example.org' })

      const nobodyWorkspace = {
        id: createRandomString(),
        name: 'nobody',
        ownerId: admin.id,
        description: '',
        discoverabilityEnabled: true
      }
      await createTestWorkspace(nobodyWorkspace, admin, { domain: 'example.org' })

      const nonAdminWorkspace = {
        id: createRandomString(),
        name: 'nonadmin',
        ownerId: admin.id,
        description: '',
        discoverabilityEnabled: true
      }
      await createTestWorkspace(nonAdminWorkspace, admin, { domain: 'example.org' })
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
      const workspace1Res = await sessionAdmin.execute(
        GetWorkspaceWithJoinRequestsDocument,
        {
          workspaceId: workspace1.id
        }
      )
      expect(workspace1Res).to.not.haveGraphQLErrors()

      const { items: items1, totalCount: totalCount1 } =
        workspace1Res.data!.workspace!.adminWorkspacesJoinRequests!

      expect(totalCount1).to.equal(1)

      expect(items1).to.have.length(1)
      expect(items1[0].status).to.equal('pending')
      expect(items1[0].workspace.id).to.equal(workspace1.id)
      expect(items1[0].user.id).to.equal(user1.id)

      const workspace2Res = await sessionAdmin.execute(
        GetWorkspaceWithJoinRequestsDocument,
        {
          workspaceId: workspace2.id
        }
      )
      expect(workspace2Res).to.not.haveGraphQLErrors()

      const { items: items2, totalCount: totalCount2 } =
        workspace2Res.data!.workspace!.adminWorkspacesJoinRequests!

      expect(totalCount2).to.equal(1)

      expect(items2).to.have.length(1)
      expect(items2[0].status).to.equal('pending')
      expect(items2[0].workspace.id).to.equal(workspace2.id)
      expect(items2[0].user.id).to.equal(user2.id)
    })
  })
})
