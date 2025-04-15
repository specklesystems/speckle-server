import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  assignToWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers,
  login
} from '@/test/authHelper'
import {
  GetWorkspaceDocument,
  GetWorkspaceWithSeatsByTypeDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const { FF_BILLING_INTEGRATION_ENABLED, FF_WORKSPACES_MODULE_ENABLED } =
  getFeatureFlags()

describe('Workspaces Billing', () => {
  let apollo: TestApolloServer

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin,
    verified: true
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([testAdminUser])
    const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: testAdminUser.id,
        token,
        role: testAdminUser.role,
        scopes: AllScopes
      })
    })
  })
  ;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
    'query workspace.readOnly',
    () => {
      it('should return false for workspace plan status valid', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'valid' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.false
      })
      it('should return true for workspace plan status expired', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'expired' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.true
      })
      it('should return false for workspace plan status trial', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'trial' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.false
      })
    }
  )
  ;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
    'workspace.subscription',
    () => {}
  )
  ;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
    'workspace.seatsByType',
    () => {
      it('should return the number of editors and viewers in a workspace', async () => {
        const user = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.Admin,
          verified: true
        })
        const workspace = {
          id: createRandomString(),
          name: createRandomString(),
          slug: cryptoRandomString({ length: 10 }),
          ownerId: user.id
        }
        await createTestWorkspace(workspace, user, {
          addPlan: { name: 'pro', status: 'valid' }
        })
        const viewer1 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          viewer1,
          Roles.Workspace.Member,
          WorkspaceSeatType.Viewer
        )
        const viewer2 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          viewer2,
          Roles.Workspace.Member,
          WorkspaceSeatType.Viewer
        )

        const editor1 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          editor1,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        )
        const editor2 = await createTestUser({
          name: createRandomString(),
          email: createRandomEmail(),
          role: Roles.Server.User,
          verified: true
        })
        await assignToWorkspace(
          workspace,
          editor2,
          Roles.Workspace.Member,
          WorkspaceSeatType.Editor
        )

        const session = await login(user)

        const res = await session.execute(GetWorkspaceWithSeatsByTypeDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        const seats = res.data?.workspace.seatsByType
        expect(seats?.viewers?.totalCount).to.eq(2)
        expect(seats?.editors?.totalCount).to.eq(3)
      })
    }
  )
})
