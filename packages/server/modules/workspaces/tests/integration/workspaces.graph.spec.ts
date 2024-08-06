import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser
} from '@/test/authHelper'
import { Roles } from '@speckle/shared'
import {
  CreateWorkspaceDocument,
  GetActiveUserWorkspacesDocument,
  GetWorkspaceDocument,
  UpdateWorkspaceDocument,
  ActiveUserLeaveWorkspaceDocument,
  UpdateWorkspaceRoleDocument
} from '@/test/graphql/generated/graphql'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { beforeEachContext } from '@/test/hooks'
import { AllScopes } from '@/modules/core/helpers/mainConstants'

describe('Workspaces GQL CRUD', () => {
  let apollo: TestApolloServer

  const testUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin
  }

  const userB: BasicTestUser = {
    id: '',
    name: 'Alice speckle',
    email: 'alice-speckle@example.org',
    role: Roles.Server.User
  }

  before(async () => {
    await beforeEachContext()
    await Promise.all([createTestUser(testUser), createTestUser(userB)])

    const token = await createAuthTokenForUser(testUser.id, AllScopes)
    apollo = await testApolloServer({
      context: createTestContext({
        auth: true,
        userId: testUser.id,
        token,
        role: testUser.role,
        scopes: AllScopes
      })
    })
  })

  describe('retrieval operations', () => {
    const workspaceIds: string[] = []

    before(async () => {
      const workspaces: Pick<Workspace, 'name'>[] = [
        { name: 'Workspace A' },
        { name: 'Workspace B' }
      ]

      const results = await Promise.all(
        workspaces.map((workspace) =>
          apollo.execute(CreateWorkspaceDocument, { input: workspace })
        )
      )

      for (const result of results) {
        workspaceIds.push(result.data!.workspaceMutations.create.id)
      }
    })

    describe('query workspace', () => {
      it('should return a workspace that exists', async () => {
        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspaceIds[0]
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace).to.exist
      })

      it('throw a not found error if the workspace does not exist', async () => {
        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: cryptoRandomString({ length: 6 })
        })
        expect(res).to.haveGraphQLErrors('not found')
      })
    })

    describe('query activeUser.workspaces', () => {
      it('should return all workspaces for a user', async () => {
        const res = await apollo.execute(GetActiveUserWorkspacesDocument, {})

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.activeUser?.workspaces?.items?.length).to.above(1)
      })
    })
  })

  describe('management operations', () => {
    describe('mutation workspaceMutations.create', () => {
      it('should create a workspace', async () => {
        const workspaceName = cryptoRandomString({ length: 6 })

        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: workspaceName }
        })
        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: createRes.data!.workspaceMutations.create.id
        })

        expect(createRes).to.not.haveGraphQLErrors()
        expect(getRes).to.not.haveGraphQLErrors()
        expect(getRes.data?.workspace).to.exist
        expect(getRes.data?.workspace?.name).to.equal(workspaceName)
      })
    })

    describe('mutation workspaceMutations.update', () => {
      it('should update a workspace', async () => {
        const createRes = await apollo.execute(CreateWorkspaceDocument, {
          input: { name: cryptoRandomString({ length: 6 }) }
        })

        const workspaceName = cryptoRandomString({ length: 6 })

        await apollo.execute(UpdateWorkspaceDocument, {
          input: {
            id: createRes.data!.workspaceMutations.create.id,
            name: workspaceName
          }
        })

        const getRes = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: createRes.data!.workspaceMutations.create.id
        })

        expect(createRes).to.not.haveGraphQLErrors()
        expect(getRes).to.not.haveGraphQLErrors()
        expect(getRes.data?.workspace.name).to.equal(workspaceName)
      })
    })
    describe('mutation activeUserMutations.userWorkspaceMutations', () => {
      describe('leave', () => {
        it('allows the active user to leave a workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name }
          })

          const id = workspaceCreateResult.data?.workspaceMutations.create.id
          if (!id) throw new Error('This should have succeeded')

          await apollo.execute(UpdateWorkspaceRoleDocument, {
            input: {
              userId: userB.id,
              workspaceId: id,
              role: Roles.Workspace.Admin
            }
          })

          let userWorkspaces = await apollo.execute(GetActiveUserWorkspacesDocument, {})

          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.true

          const leaveResult = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
            id
          })

          expect(leaveResult.errors).to.be.undefined

          userWorkspaces = await apollo.execute(GetActiveUserWorkspacesDocument, {})
          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.false
        })
        it('stops the last workspace admin from leaving the workspace', async () => {
          const name = cryptoRandomString({ length: 6 })
          const workspaceCreateResult = await apollo.execute(CreateWorkspaceDocument, {
            input: { name }
          })

          const id = workspaceCreateResult.data?.workspaceMutations.create.id
          if (!id) throw new Error('This should have succeeded')

          const leaveResult = await apollo.execute(ActiveUserLeaveWorkspaceDocument, {
            id
          })

          expect(leaveResult.errors?.length).to.be.greaterThanOrEqual(1)

          const userWorkspaces = await apollo.execute(
            GetActiveUserWorkspacesDocument,
            {}
          )
          expect(
            userWorkspaces.data?.activeUser?.workspaces.items
              .map((i) => i.name)
              .includes(name)
          ).to.be.true
        })
      })
    })
  })
})
