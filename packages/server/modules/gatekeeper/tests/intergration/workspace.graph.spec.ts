import { AllScopes } from '@/modules/core/helpers/mainConstants'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUsers
} from '@/test/authHelper'
import { GetWorkspaceDocument } from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

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
})
