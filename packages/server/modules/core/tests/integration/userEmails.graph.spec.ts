import { beforeEachContext, truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import { describe, it } from 'mocha'
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
import { testApolloServer } from '@/test/graphqlHelper'
import {
  CreateUserEmailDocument,
  DeleteUserEmailDocument,
  SetPrimaryUserEmailDocument
} from '@/test/graphql/generated/graphql'
import { UserEmails, Users } from '@/modules/core/dbSchema'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  countAdminUsersFactory,
  legacyGetUserFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { createUserFactory } from '@/modules/core/services/users/management'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const getServerInfo = getServerInfoFactory({ db })
const getUser = legacyGetUserFactory({ db })
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

describe('User emails graphql @core', () => {
  before(async () => {
    await beforeEachContext()
  })
  beforeEach(async () => {
    await truncateTables([Users.name, UserEmails.name])
  })

  describe('createUserEmail mutation', () => {
    it('should create new email for user', async () => {
      const firstEmail = createRandomEmail()
      const userId = await createUser({
        name: 'emails user',
        email: firstEmail,
        password: createRandomPassword()
      })
      const secondEmail = createRandomEmail()

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(CreateUserEmailDocument, {
        input: { email: secondEmail }
      })

      expect(res).to.not.haveGraphQLErrors()
      const userEmail = await findEmailFactory({ db })({ email: secondEmail, userId })

      expect(userEmail).to.be.ok
      expect(userEmail!.email.toLowerCase()).to.eq(secondEmail.toLowerCase())
      expect(userEmail!.userId).to.eq(userId)

      const createRes = res.data?.activeUserMutations.emailMutations.create
      expect(createRes).to.be.ok
      expect(createRes?.emails.length).to.eq(2)
      expect((createRes?.emails || []).map((e) => e.email)).to.deep.equalInAnyOrder([
        firstEmail.toLowerCase(),
        secondEmail.toLowerCase()
      ])
    })
  })

  describe('deleteUserEmail mutation', () => {
    it('should delete email for user', async () => {
      const firstEmail = createRandomEmail()
      const userId = await createUser({
        name: 'emails user',
        email: firstEmail,
        password: createRandomPassword()
      })
      const email = createRandomEmail()

      const { id } = await createUserEmail({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(DeleteUserEmailDocument, { input: { id } })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.activeUserMutations.emailMutations.delete.id).to.be.ok
      expect(
        res.data?.activeUserMutations.emailMutations.delete.emails.map((e) =>
          e.email.toLowerCase()
        )
      ).deep.equal([firstEmail.toLowerCase()])
    })
  })

  describe('setPrimaryUserEmail mutation', () => {
    it('should set primary email for user', async () => {
      const userId = await createUser({
        name: 'emails user',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const email = createRandomEmail()

      const { id } = await createUserEmail({
        userEmail: {
          email,
          userId,
          verified: true,
          primary: false
        }
      })

      const apollo = await testApolloServer({ authUserId: userId })
      const res = await apollo.execute(SetPrimaryUserEmailDocument, { input: { id } })

      expect(res).to.not.haveGraphQLErrors()
      expect(res.data?.activeUserMutations.emailMutations.setPrimary.id).to.be.ok
      expect(
        res.data?.activeUserMutations.emailMutations.setPrimary.emails
          .find((e) => !!e.primary)
          ?.email.toLowerCase()
      ).to.eq(email.toLowerCase())
    })
  })
})
