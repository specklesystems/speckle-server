import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { mapMainWorkspaceRoleToGqlRole } from '@/modules/workspaces/helpers/roles'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser
} from '@/test/authHelper'
import {
  GetWorkspaceDocument,
  UpdateWorkspaceRoleDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

describe('Workspaces Roles GQL', () => {
  let apollo: TestApolloServer
  let workspace: BasicTestWorkspace

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle-workspace-admin@example.org',
    role: Roles.Server.Admin
  }

  const testMemberUser: BasicTestUser = {
    id: '',
    name: 'James Speckle',
    email: 'james-speckle-workspace-member@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await Promise.all(
      [testAdminUser, testMemberUser].map((user) => createTestUser(user))
    )
    const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: testAdminUser.id,
        token,
        role: testAdminUser.role,
        scopes: AllScopes
      })
    })

    const testWorkspace: BasicTestWorkspace = {
      id: '',
      ownerId: testAdminUser.id,
      name: 'My Test Workspace'
    }

    await createTestWorkspace(testWorkspace, testAdminUser)

    workspace = testWorkspace
  })

  describe('update workspace role', () => {
    after(async () => {
      await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })
    })

    it('should create a role if none exists', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: mapMainWorkspaceRoleToGqlRole(Roles.Workspace.Admin)
        }
      })

      const { data } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: workspace.id
      })
      const userRole = data?.workspace.team.find(
        (user) => user.id === testMemberUser.id
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(userRole).to.exist
      expect(userRole?.role).to.equal(Roles.Workspace.Admin)
    })

    it('should update a role that exists', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: mapMainWorkspaceRoleToGqlRole(Roles.Workspace.Member)
        }
      })

      const { data } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: workspace.id
      })
      const userRole = data?.workspace.team.find(
        (user) => user.id === testMemberUser.id
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(userRole).to.exist
      expect(userRole?.role).to.equal(Roles.Workspace.Member)
    })

    it('should throw if attempting to remove last admin', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testAdminUser.id,
          workspaceId: workspace.id,
          role: mapMainWorkspaceRoleToGqlRole(Roles.Workspace.Member)
        }
      })

      expect(res).to.haveGraphQLErrors('last admin')
    })
  })

  describe('delete workspace role', () => {
    before(async () => {
      await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: mapMainWorkspaceRoleToGqlRole(Roles.Workspace.Member)
        }
      })
    })

    it('should delete the specified role', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testMemberUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })

      const { data } = await apollo.execute(GetWorkspaceDocument, {
        workspaceId: workspace.id
      })
      const userRole = data?.workspace.team.find(
        (user) => user.id === testMemberUser.id
      )

      expect(res).to.not.haveGraphQLErrors()
      expect(userRole).to.not.exist
    })

    it('should throw if attempting to remove last admin', async () => {
      const res = await apollo.execute(UpdateWorkspaceRoleDocument, {
        input: {
          userId: testAdminUser.id,
          workspaceId: workspace.id,
          role: null
        }
      })

      expect(res).to.haveGraphQLErrors('last admin')
    })
  })
})
