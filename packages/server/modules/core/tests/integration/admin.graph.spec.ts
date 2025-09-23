import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import { Roles } from '@speckle/shared'
import { findEmailFactory } from '@/modules/core/repositories/userEmails'
import { getPendingVerificationByEmailFactory } from '@/modules/emails/repositories'
import { getUserFactory } from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import { AdminMutationsDocument } from '@/modules/core/graph/generated/graphql'

describe('Server Admin GraphQL', () => {
  const serverAdminUser: BasicTestUser = {
    id: '',
    email: '',
    verified: false,
    name: 'I am Admin',
    role: Roles.Server.Admin
  }

  const basicUser: BasicTestUser = {
    id: '',
    email: '',
    verified: false,
    name: 'I am User',
    role: Roles.Server.User
  }

  let apollo: TestApolloServer

  before(async () => {
    await beforeEachContext()
    await createTestUser(serverAdminUser)
    await createTestUser(basicUser)
    apollo = await testApolloServer({ authUserId: serverAdminUser.id })
  })

  it('verify another users email', async () => {
    const userFromDbBefore = await getUserFactory({ db })(basicUser.id)
    expect(userFromDbBefore).to.be.ok
    expect(userFromDbBefore!.verified).to.be.false

    const verifyRes = await apollo.execute(AdminMutationsDocument, {
      input: { email: basicUser.email }
    })
    expect(verifyRes).to.not.haveGraphQLErrors()
    expect(verifyRes.data?.admin.updateEmailVerification).to.be.true

    const userEmail = await findEmailFactory({ db })({ email: basicUser.email })
    expect(userEmail).to.be.ok
    expect(userEmail!.verified).to.be.true

    const pendingVerifications = await getPendingVerificationByEmailFactory({
      db,
      verificationTimeoutMinutes: 100 // we don't care about timeout here
    })({ email: basicUser.email })
    expect(pendingVerifications).to.be.null

    const user = await getUserFactory({ db })(basicUser.id)
    expect(user).to.be.ok
    expect(user!.verified).to.be.true
  })
})
