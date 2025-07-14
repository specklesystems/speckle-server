import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  assignToWorkspaces,
  BasicTestWorkspace,
  createTestOidcProvider,
  createTestSsoSession,
  createTestWorkspaces
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import {
  ActiveUserExpiredSsoSessionsDocument,
  GetActiveUserWorkspacesDocument,
  GetProjectDocument,
  GetWorkspaceDocument,
  GetWorkspaceProjectsDocument,
  GetWorkspaceSsoDocument
} from '@/modules/core/graph/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { truncateTables } from '@/test/hooks'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { AllScopes, Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const { FF_WORKSPACES_SSO_ENABLED } = getFeatureFlags()

;(FF_WORKSPACES_SSO_ENABLED ? describe : describe.skip)('Workspace SSO', () => {
  let memberApollo: TestApolloServer
  let guestApollo: TestApolloServer

  const workspaceAdmin: BasicTestUser = {
    id: '',
    name: 'John Admin',
    email: `${cryptoRandomString({ length: 9 })}@example.org`,
    role: Roles.Server.Admin
  }

  const workspaceMember: BasicTestUser = {
    id: '',
    name: 'John Member',
    email: `${cryptoRandomString({ length: 9 })}@example.org`
  }

  const workspaceGuest: BasicTestUser = {
    id: '',
    name: 'John Guest',
    email: `${cryptoRandomString({ length: 9 })}@example.org`
  }

  const testWorkspaceWithSso: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'Test SSO Workspace',
    slug: 'gql-sso-workspace'
  }
  let testWorkspaceWithSsoProviderId = ''
  let testWorkspaceWithSsoProjectId = ''

  const testWorkspaceWithoutSso: BasicTestWorkspace = {
    id: '',
    ownerId: '',
    name: 'Test Non-SSO Workspace',
    slug: 'gql-no-sso-workspace'
  }

  before(async () => {
    await createTestUsers([workspaceAdmin, workspaceMember, workspaceGuest])
    await createTestWorkspaces([
      [testWorkspaceWithSso, workspaceAdmin],
      [testWorkspaceWithoutSso, workspaceAdmin]
    ])
    testWorkspaceWithSsoProviderId = await createTestOidcProvider(
      testWorkspaceWithSso.id
    )

    await assignToWorkspaces([
      [testWorkspaceWithSso, workspaceMember, Roles.Workspace.Member],
      [testWorkspaceWithSso, workspaceGuest, Roles.Workspace.Guest],
      [testWorkspaceWithoutSso, workspaceMember, Roles.Workspace.Member],
      [testWorkspaceWithoutSso, workspaceGuest, Roles.Workspace.Guest]
    ])

    memberApollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: workspaceMember.id,
        token: await createAuthTokenForUser(workspaceMember.id),
        role: Roles.Server.User,
        scopes: AllScopes
      })
    })
    guestApollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: workspaceGuest.id,
        token: await createAuthTokenForUser(workspaceGuest.id),
        role: Roles.Server.User,
        scopes: AllScopes
      })
    })

    const testProject: BasicTestStream = {
      id: '',
      ownerId: '',
      name: 'Workspace Project',
      workspaceId: testWorkspaceWithSso.id,
      visibility: ProjectRecordVisibility.Workspace
    }

    await createTestStream(testProject, workspaceAdmin)
    testWorkspaceWithSsoProjectId = testProject.id
  })

  afterEach(async () => {
    await truncateTables(['user_sso_sessions'])
  })

  describe('given a workspace with SSO configured', () => {
    describe('when a workspace member requests workspace information', () => {
      describe('with a valid SSO session', () => {
        beforeEach(async () => {
          await createTestSsoSession(workspaceMember.id, testWorkspaceWithSso.id)
        })

        it('should allow the request', async () => {
          const res = await memberApollo.execute(GetWorkspaceDocument, {
            workspaceId: testWorkspaceWithSso.id
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspace.slug).to.equal('gql-sso-workspace')
        })

        it('should provide active SSO session information on workspace type', async () => {
          const res = await memberApollo.execute(GetWorkspaceSsoDocument, {
            id: testWorkspaceWithSso.id
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspace.sso).to.not.be.undefined
          expect(res.data?.workspace.sso?.provider?.id).to.equal(
            testWorkspaceWithSsoProviderId
          )
          expect(res.data?.workspace.sso?.session).to.not.be.undefined
        })
      })

      describe('without a valid SSO session', () => {
        it('should throw and provide redirect information', async () => {
          const resA = await memberApollo.execute(GetWorkspaceDocument, {
            workspaceId: testWorkspaceWithSso.id
          })
          expect(resA).to.haveGraphQLErrors({ message: 'gql-sso-workspace' })
          expect(resA).to.haveGraphQLErrors({
            code: 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
          })

          const resB = await memberApollo.execute(GetWorkspaceProjectsDocument, {
            id: testWorkspaceWithSso.id
          })
          expect(resB).to.haveGraphQLErrors({ message: 'gql-sso-workspace' })
          expect(resB).to.haveGraphQLErrors({
            code: 'SSO_SESSION_MISSING_OR_EXPIRED_ERROR'
          })

          const resC = await memberApollo.execute(GetProjectDocument, {
            id: testWorkspaceWithSsoProjectId
          })
          expect(resC).to.haveGraphQLErrors({
            message: 'SSO session is expired or it does not exist'
          })
        })

        it('should allow limited access to workspace memberships', async () => {
          const res = await memberApollo.execute(GetActiveUserWorkspacesDocument, {})

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.activeUser?.workspaces.items.length).to.equal(2)
        })

        it('should surface expired session', async () => {
          const res = await memberApollo.execute(
            ActiveUserExpiredSsoSessionsDocument,
            {}
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.activeUser?.expiredSsoSessions.length).to.equal(1)
          expect(res.data?.activeUser?.expiredSsoSessions[0].slug).to.equal(
            'gql-sso-workspace'
          )
        })
      })
    })

    describe('when a workspace guest requests workspace information', () => {
      describe('without a valid SSO session', () => {
        it('should allow the request', async () => {
          const res = await guestApollo.execute(GetWorkspaceDocument, {
            workspaceId: testWorkspaceWithSso.id
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspace.slug).to.equal('gql-sso-workspace')
        })

        it('should not show the workspace as an expired SSO session', async () => {
          const res = await guestApollo.execute(
            ActiveUserExpiredSsoSessionsDocument,
            {}
          )

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.activeUser?.expiredSsoSessions.length).to.equal(0)
        })
      })
    })
  })

  describe('given a workspace without SSO configured', () => {
    describe('when a workspace member requests workspace information', () => {
      it('should allow the request', async () => {
        const res = await memberApollo.execute(GetWorkspaceDocument, {
          workspaceId: testWorkspaceWithoutSso.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.slug).to.equal('gql-no-sso-workspace')
      })

      it('should return workspace provider information as `null`', async () => {
        const res = await memberApollo.execute(GetWorkspaceSsoDocument, {
          id: testWorkspaceWithoutSso.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.sso).to.be.null
      })
    })

    describe('when a workspace guest requests workspace information', () => {
      it('should allow the request', async () => {
        const res = await guestApollo.execute(GetWorkspaceDocument, {
          workspaceId: testWorkspaceWithoutSso.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace.slug).to.equal('gql-no-sso-workspace')
      })
    })
  })
})
