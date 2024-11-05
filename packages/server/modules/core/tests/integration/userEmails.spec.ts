import { before } from 'mocha'
import { beforeEachContext } from '@/test/hooks'
import { expect } from 'chai'
import {
  countAdminUsersFactory,
  getUserByEmailFactory,
  getUserFactory,
  legacyGetPaginatedUsersCountFactory,
  legacyGetPaginatedUsersFactory,
  legacyGetUserByEmailFactory,
  listUsersFactory,
  markUserAsVerifiedFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import {
  createRandomEmail,
  createRandomPassword,
  randomizeCase
} from '@/modules/core/helpers/testHelpers'
import {
  createUserEmailFactory,
  deleteUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  findPrimaryEmailForUserFactory,
  setPrimaryUserEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { expectToThrow } from '@/test/assertionHelper'
import { MaybeNullOrUndefined } from '@speckle/shared'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { UserEmails, Users } from '@/modules/core/dbSchema'
import { UserEmailPrimaryUnverifiedError } from '@/modules/core/errors/userEmails'
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
import { createUserFactory } from '@/modules/core/services/users/management'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = legacyGetPaginatedUsersFactory({ db })
const countUsers = legacyGetPaginatedUsersCountFactory({ db })

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
const getUserByEmail = getUserByEmailFactory({ db })
const legacyGetUserByEmail = legacyGetUserByEmailFactory({ db })
const listUsers = listUsersFactory({ db })
const markUserAsVerified = markUserAsVerifiedFactory({ db })

describe('Core @user-emails', () => {
  before(async () => {
    await beforeEachContext()
  })
  describe('getUserByEmail', () => {
    it('should return null if user email does not exist', async () => {
      expect(await getUserByEmail('test@example.org')).to.be.null
    })
  })

  describe('markUserEmailAsVerified', () => {
    it('should mark user email as verified', async () => {
      const email = createRandomEmail()
      await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      await markUserAsVerified(email)

      const userEmail = await findEmailFactory({ db })({ email })
      expect(userEmail?.verified).to.be.true
    })
  })

  describe('deleteUserEmail', () => {
    it('should throw and error when trying to delete last email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      const userEmail = await findEmailFactory({ db })({ userId, email })
      expect(userEmail).to.be.ok

      const err = await expectToThrow(() =>
        deleteUserEmailFactory({ db })({ id: userEmail!.id, userId })
      )
      expect(err.message).to.eq('Cannot delete last user email')
    })

    it('should throw and error when trying to delete primary email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email,
        password: createRandomPassword()
      })

      await createUserEmail({
        userEmail: {
          email: createRandomEmail(),
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({ userId, email, primary: true })
      expect(userEmail).to.be.ok

      const err = await expectToThrow(() =>
        deleteUserEmailFactory({ db })({ id: userEmail!.id, userId })
      )
      expect(err.message).to.eq('Cannot delete primary email')
    })

    it('should delete email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmail({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })
      expect(userEmail).to.be.ok

      const deleted = await deleteUserEmailFactory({ db })({
        id: userEmail!.id,
        userId
      })

      expect(deleted).to.be.true

      const deletedUserEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })

      expect(deletedUserEmail).to.not.ok
    })
  })

  describe('setPrimaryUserEmail', () => {
    it('should throw an error if trying to set non verified email as primary', async () => {
      const email1 = createRandomEmail()
      const email2 = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: email1,
        password: createRandomPassword()
      })

      await createUserEmail({
        userEmail: {
          email: email2,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email: email2
      })

      const err = await expectToThrow(() =>
        setPrimaryUserEmailFactory({ db })({
          id: userEmail!.id,
          userId
        })
      )
      expect(err.name).to.eq(new UserEmailPrimaryUnverifiedError().name)

      const previousPrimary = await findEmailFactory({ db })({
        userId,
        email: email1
      })
      const newPrimary = await findEmailFactory({ db })({
        userId,
        email: email2
      })

      // nothing is changed
      expect(previousPrimary?.primary).to.be.true
      expect(newPrimary?.primary).to.be.false
    })
    it('should set primary email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmail({
        userEmail: {
          email,
          userId,
          verified: true,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })
      expect(userEmail).to.be.ok

      const updated = await setPrimaryUserEmailFactory({ db })({
        id: userEmail!.id,
        userId
      })

      expect(updated).to.be.true

      const previousPrimary = await findEmailFactory({ db })({
        userId,
        primary: false
      })
      const newPrimary = await findEmailFactory({ db })({
        userId,
        primary: true
      })

      expect(previousPrimary?.primary).to.be.false
      expect(newPrimary?.primary).to.be.true
    })
  })

  describe('validateAndCreateUserEmailFactory', () => {
    it('should throw an error when trying to create a primary email for a user and there is already one for that user', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      const err = await expectToThrow(() =>
        createUserEmail({
          userEmail: {
            email,
            userId,
            primary: true
          }
        })
      )

      expect(err.message).to.eq('A primary email already exists for this user')
    })
    it('should throw an error when trying to create an email for a user and the same email is already on the server', async () => {
      const email = createRandomEmail()
      const userId1 = await createUser({
        name: 'John Doe 2',
        email: createRandomEmail(),
        password: createRandomPassword()
      })
      const userId2 = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      // pre existing email
      await createUserEmail({
        userEmail: {
          email,
          userId: userId1,
          primary: false
        }
      })

      const err = await expectToThrow(() =>
        createUserEmail({
          userEmail: {
            email,
            userId: userId2,
            primary: false
          }
        })
      )

      expect(err.message).to.eq('Email already exists')
    })
  })

  describe('updateUserEmail', () => {
    it('should throw an error when trying to mark an email as primary and there is already one for the user', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        name: 'John Doe',
        email: createRandomEmail(),
        password: createRandomPassword()
      })

      await createUserEmail({
        userEmail: {
          email,
          userId,
          primary: false
        }
      })
      const userEmail = await findEmailFactory({ db })({
        userId,
        email,
        primary: false
      })
      expect(userEmail).to.be.ok

      const err = await expectToThrow(() =>
        updateUserEmailFactory({ db })({
          query: {
            id: userEmail!.id,
            userId
          },
          update: { primary: true }
        })
      )

      expect(err.message).to.eq('A primary email already exists for this user')
    })
  })

  describe('supports case insensitive email lookup/mutation', () => {
    const randomCaseGuy: BasicTestUser = {
      name: 'RAnDoM cAsE gUY',
      email: createRandomEmail(),
      password: createRandomPassword(),
      id: ''
    }

    const updateEmailDirectly = async (newEmail: string) => {
      // Intentionally putting case-sensitive email in DB, avoiding any code protection
      // to ensure that the lookups still work
      const [emailsRow] = await UserEmails.knex()
        .where({ userId: randomCaseGuy.id })
        .update({ email: newEmail }, '*')

      expect(emailsRow.email).to.eq(newEmail)

      const [usersRow] = await Users.knex()
        .where({ id: randomCaseGuy.id })
        .update({ email: newEmail }, '*')
      expect(usersRow.email).to.eq(newEmail)
    }

    const assertLowercaseEquality = (
      val1: MaybeNullOrUndefined<string>,
      val2: string
    ) => {
      expect(val1?.toLowerCase()).to.eq(val2.toLowerCase())
    }

    const assertLowercase = (val1: MaybeNullOrUndefined<string>) => {
      expect(val1).to.be.ok
      expect(val1).to.eq(val1!.toLowerCase())
    }

    before(async () => {
      await createTestUsers([randomCaseGuy])
      await updateEmailDirectly(randomCaseGuy.email)
    })

    it('with findEmailFactory()', async () => {
      const { email, id: userId } = randomCaseGuy
      const foundEmail = (
        await findEmailFactory({ db })({ email: randomizeCase(email), userId })
      )?.email
      assertLowercaseEquality(foundEmail, email)
    })

    it('with updateUserEmailFactory()', async () => {
      const { email, id: userId } = randomCaseGuy
      const newEmail = createRandomEmail()
      const updatedEmail = (
        await updateUserEmailFactory({ db })({
          query: { email: randomizeCase(email), userId },
          update: { email: newEmail }
        })
      )?.email

      assertLowercaseEquality(updatedEmail, newEmail)
      assertLowercase(updatedEmail)

      randomCaseGuy.email = newEmail
      updateEmailDirectly(newEmail)
    })

    it('with validateAndCreateUserEmailFactory()', async () => {
      const { id: userId } = randomCaseGuy
      const newEmail = createRandomEmail()
      const createdEmail = (
        await createUserEmail({
          userEmail: { email: newEmail, userId, primary: false }
        })
      )?.email

      assertLowercaseEquality(createdEmail, newEmail)
      assertLowercase(createdEmail)
    })

    it('with findPrimaryEmailForUserFactory()', async () => {
      const { email } = randomCaseGuy
      const primaryEmail = (
        await findPrimaryEmailForUserFactory({ db })({
          email: randomizeCase(email),
          userId: randomCaseGuy.id
        })
      )?.email
      assertLowercaseEquality(primaryEmail, email)
    })

    it('with listUsers()', async () => {
      const [user] = await listUsers({
        query: randomizeCase(randomCaseGuy.email),
        limit: 1
      })

      expect(user).to.be.ok
      assertLowercaseEquality(user.email, randomCaseGuy.email)
    })

    it('with countUsers()', async () => {
      const count = await countUsers(randomizeCase(randomCaseGuy.email))
      expect(count).to.eq(1)
    })

    it('with getUserByEmail()', async () => {
      const user = await getUserByEmail(randomizeCase(randomCaseGuy.email))
      expect(user).to.be.ok
      assertLowercaseEquality(user?.email, randomCaseGuy.email)
    })

    it('with markUserAsVerified()', async () => {
      const res = await markUserAsVerified(randomizeCase(randomCaseGuy.email))
      expect(res).to.be.ok

      const user = await getUserByEmail(randomCaseGuy.email)
      expect(user?.verified).to.be
    })

    it('with legacyGetUserByEmail()', async () => {
      const user = await legacyGetUserByEmail({
        email: randomizeCase(randomCaseGuy.email)
      })
      expect(user).to.be.ok
      assertLowercaseEquality(user?.email, randomCaseGuy.email)
    })

    it('with legacyGetPaginatedUsers()', async () => {
      const users = await getUsers(10, 0, randomizeCase(randomCaseGuy.email))
      expect(users).to.be.ok
      expect(users).to.have.length(1)
      assertLowercaseEquality(users[0].email, randomCaseGuy.email)
    })

    it('with legacyGetPaginatedUsersCount()', async () => {
      const count = await countUsers(randomizeCase(randomCaseGuy.email))
      expect(count).to.eq(1)
    })
  })
})
