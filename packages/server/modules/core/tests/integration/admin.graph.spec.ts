import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { ExecuteOperationResponse, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { Roles } from '@speckle/shared'
import { AdminMutationsDocument } from '@/modules/core/graph/generated/graphql'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'
import gql from 'graphql-tag'

const testForbiddenResponse = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: ExecuteOperationResponse<Record<string, any>>
) => {
  expect(result.errors, 'This should have failed').to.exist
  expect(result.errors!.length).to.be.above(0)
  expect(result.errors![0].extensions!.code, JSON.stringify(result.errors)).to.match(
    /(STREAM_INVALID_ACCESS_ERROR|FORBIDDEN|UNAUTHORIZED_ACCESS_ERROR)/
  )
}

const getActiveUserVerifiedQuery = gql`
  query GetActiveUser {
    activeUser {
      verified
      emails {
        verified
      }
    }
  }
`

describe('Admin @core-admin Graphql', () => {
  const serverAdminUser: BasicTestUser = {
    id: '',
    email: createRandomEmail(),
    name: 'I am Admin',
    role: Roles.Server.Admin
  }

  const regularServerUser = {
    id: '',
    email: createRandomEmail(),
    name: 'regular server user',
    role: Roles.Server.User
  }
  const archivedUser = {
    id: '',
    email: createRandomEmail(),
    name: 'archived user',
    role: Roles.Server.ArchivedUser
  }
  const unaffiliatedUser = {
    id: '',
    email: createRandomEmail(),
    name: 'unaffiliated user',
    role: Roles.Server.Guest
  }

  before(async () => {
    await beforeEachContext()
    await createTestUser(serverAdminUser)
    await createTestUser(regularServerUser)
    await createTestUser(archivedUser)
    await createTestUser(unaffiliatedUser)
  })

  describe('updateEmailVerification', () => {
    describe('when attempting to verify another users email', () => {
      const testCases = [
        { user: serverAdminUser, canVerify: true },
        { user: regularServerUser, canVerify: false },
        { user: archivedUser, canVerify: false },
        { user: unaffiliatedUser, canVerify: false }
      ]

      testCases.forEach(({ user: testUser, canVerify }) => {
        let apollo: TestApolloServer
        before(async () => {
          // we are purposefully not using the helper to create the token, as we want to test with multiple users
          apollo = await testApolloServer()
        })

        it(`a ${testUser.role} is ${canVerify ? 'allowed' : 'forbidden'}`, async () => {
          const userToVerify = {
            id: '',
            email: createRandomEmail(),
            name: 'unverified user',
            role: Roles.Server.User,
            verified: false
          }
          await createTestUser(userToVerify)

          const preCheckRes = await apollo.execute(
            getActiveUserVerifiedQuery,
            {},
            {
              authUserId: userToVerify.id,
              assertNoErrors: true
            }
          )
          expect(preCheckRes.data?.activeUser).to.exist
          expect(preCheckRes.data?.activeUser?.verified).to.equal(false)
          expect(
            preCheckRes.data?.activeUser.emails.some(
              (email: { verified: boolean }) => email.verified
            )
          ).to.be.false

          const verifyRes = await apollo.execute(
            AdminMutationsDocument,
            {
              input: { email: userToVerify.email }
            },
            {
              authUserId: testUser.id // auth as the test user
            }
          )
          if (!canVerify) {
            testForbiddenResponse(verifyRes)
            return
          }

          expect(verifyRes).to.not.haveGraphQLErrors()
          expect(verifyRes.data?.admin.updateEmailVerification).to.equal(canVerify)

          const postCheckRes = await apollo.execute(
            getActiveUserVerifiedQuery,
            {},
            {
              authUserId: userToVerify.id,
              assertNoErrors: true
            }
          )
          expect(postCheckRes.data?.activeUser.verified).to.equal(canVerify)
          expect(postCheckRes.data?.activeUser.emails).to.have.length(1)
          expect(
            postCheckRes.data?.activeUser.emails.every(
              (email: { verified: boolean }) => email.verified
            )
          ).to.equal(canVerify)
        })
      })
    })
  })
})
