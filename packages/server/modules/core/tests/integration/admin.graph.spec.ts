import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { ExecuteOperationResponse, TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { Roles } from '@speckle/shared'
import { findEmailFactory } from '@/modules/core/repositories/userEmails'
import { getPendingVerificationByEmailFactory } from '@/modules/emails/repositories'
import { getUserFactory } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import { AdminMutationsDocument } from '@/modules/core/graph/generated/graphql'
import { createRandomEmail } from '@/modules/core/helpers/testHelpers'

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
          apollo = await testApolloServer({
            authUserId: testUser?.id
          })
        })

        it(`a ${testUser.role} is ${canVerify ? 'allowed' : 'forbidden'}`, async () => {
          const userToVerify = {
            id: '',
            email: createRandomEmail(),
            name: 'unverified user',
            role: Roles.Server.Guest,
            verified: false
          }
          await createTestUser(userToVerify)

          const userFromDbBefore = await getUserFactory({ db })(userToVerify.id)
          expect(userFromDbBefore).to.be.ok
          expect(userFromDbBefore!.verified).to.be.false

          const verifyRes = await apollo.execute(AdminMutationsDocument, {
            input: { email: userToVerify.email }
          })
          if (!canVerify) {
            testForbiddenResponse(verifyRes)
            return
          }

          expect(verifyRes).to.not.haveGraphQLErrors()
          expect(verifyRes.data?.admin.updateEmailVerification).to.equal(canVerify)

          const userEmail = await findEmailFactory({ db })({
            email: userToVerify.email
          })
          expect(userEmail).to.be.ok
          expect(userEmail!.verified).to.equal(canVerify)

          const pendingVerifications = await getPendingVerificationByEmailFactory({
            db,
            verificationTimeoutMinutes: 100 // we don't care about timeout here
          })({ email: userToVerify.email })
          if (canVerify) {
            expect(pendingVerifications).to.be.undefined
          } else {
            expect(pendingVerifications).to.not.be.undefined
          }

          const user = await getUserFactory({ db })(userToVerify.id)
          expect(user).to.be.ok
          expect(user!.verified).to.equal(canVerify)
        })
      })
    })
  })
})
