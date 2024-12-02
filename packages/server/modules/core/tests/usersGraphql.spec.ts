import { Users } from '@/modules/core/dbSchema'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { getActiveUser, getOtherUser } from '@/test/graphql/users'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { before } from 'mocha'
import {
  createAuthedTestContext,
  createTestContext,
  ServerAndContext,
  testApolloServer
} from '@/test/graphqlHelper'
import { GetActiveUserEmailsDocument } from '@/test/graphql/generated/graphql'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildApolloServer } from '@/app'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  countAdminUsersFactory,
  getUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { createUserFactory } from '@/modules/core/services/users/management'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const createUserEmail = validateAndCreateUserEmailFactory({
  createUserEmail: createUserEmailFactory({ db }),
  ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
  findEmail: findEmailFactory({ db }),
  updateEmailInvites: finalizeInvitedServerRegistrationFactory({
    deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
    updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
  }),
  requestNewEmailVerification
})

const findEmail = findEmailFactory({ db })
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: createUserEmail,
  usersEventsEmitter: UsersEmitter.emit
})

describe('Users (GraphQL)', () => {
  const me: BasicTestUser = {
    id: '',
    email: '',
    name: 'its a meeeee',
    bio: 'ayyy',
    company: 'ayyy inc'
  }

  const otherGuy: BasicTestUser = {
    id: '',
    email: '',
    name: 'its an other guyyyyy',
    bio: 'fffoooo',
    company: 'fooooo inc'
  }

  before(async () => {
    await truncateTables([Users.name])
    await createTestUsers([me, otherGuy])
  })

  describe('when unauthenticated', () => {
    let apollo: ServerAndContext

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createTestContext()
      }
    })

    it('activeUser returns null', async () => {
      const results = await getActiveUser(apollo)

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.activeUser).to.be.null
    })

    it('otherUser throws an authorization error', async () => {
      const results = await getOtherUser(apollo, { id: otherGuy.id })

      expect(results.data?.otherUser).to.be.null
      expect(results).to.haveGraphQLErrors(
        'Your auth token does not have the required scope'
      )
    })
  })

  describe('when authenticated', () => {
    let apollo: ServerAndContext

    before(async () => {
      apollo = {
        apollo: await buildApolloServer(),
        context: await createAuthedTestContext(me.id)
      }
    })

    it('activeUser returns authenticated user info', async () => {
      const results = await getActiveUser(apollo)

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.activeUser?.id).to.eq(me.id)
      expect(results.data?.activeUser?.name).to.be.ok
      expect(results.data?.activeUser?.bio).to.be.ok
      expect(results.data?.activeUser?.company).to.be.ok
    })

    it('otherUser returns limited user info', async () => {
      const results = await getOtherUser(apollo, { id: otherGuy.id })

      expect(results).to.not.haveGraphQLErrors()
      expect(results.data?.otherUser?.id).to.eq(otherGuy.id)
      expect(results.data?.otherUser?.name).to.be.ok
      expect(results.data?.otherUser?.bio).to.be.ok
      expect(results.data?.otherUser?.company).to.be.ok
    })

    describe('emails field resolver', () => {
      // TODO: this logic should not be here but we need to refactor this test
      // We should avoid having the same user used in all tests to avoid tests depending on each other
      before(async () => {
        await beforeEachContext()
      })

      it('should return emails for user', async () => {
        const userId = await createUser({
          name: 'emails user',
          email: createRandomEmail(),
          password: createRandomPassword(),
          verified: false
        })
        await createUserEmail({
          userEmail: {
            email: createRandomEmail(),
            userId,
            primary: false
          }
        })

        const apollo = await testApolloServer({ authUserId: userId })
        const res = await apollo.execute(GetActiveUserEmailsDocument, {})

        expect(res).to.not.haveGraphQLErrors()
        expect(res?.data?.activeUser?.emails).to.have.length(2)
      })
    })
  })
})
