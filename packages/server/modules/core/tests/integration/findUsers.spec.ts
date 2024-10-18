import { describe } from 'mocha'
import {
  createRandomEmail,
  createRandomPassword
} from '@/modules/core/helpers/testHelpers'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  updateUserEmailFactory
} from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { expect } from 'chai'
import {
  countAdminUsersFactory,
  getUserByEmailFactory,
  getUserFactory,
  getUsersFactory,
  listUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const findEmail = findEmailFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail,
  getUser: getUserFactory({ db }),
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})
const createUser = createUserFactory({
  getServerInfo,
  findEmail,
  storeUser: storeUserFactory({ db }),
  countAdminUsers: countAdminUsersFactory({ db }),
  storeUserAcl: storeUserAclFactory({ db }),
  validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
    createUserEmail: createUserEmailFactory({ db }),
    ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
    findEmail,
    updateEmailInvites: finalizeInvitedServerRegistrationFactory({
      deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
      updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
    }),
    requestNewEmailVerification
  }),
  usersEventsEmitter: UsersEmitter.emit
})
const getUserByEmail = getUserByEmailFactory({ db })
const listUsers = listUsersFactory({ db })

describe('Find users @core', () => {
  describe('getUsers', () => {
    it('should return email field from user emails table', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (await getUsers([userId]))[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })

    it('should return email field from user emails table withRole enabled', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (await getUsers([userId], { withRole: true }))[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })
  })

  describe('listUsers', () => {
    it('should return email field from user emails table', async () => {
      const email = createRandomEmail()
      const password = createRandomPassword()

      const userId = await createUser({
        name: 'John Doe',
        password,
        email
      })

      const newEmail = createRandomEmail()

      // update user email without updating the user.email field
      await updateUserEmailFactory({ db })({
        query: { userId, email, primary: true },
        update: { email: newEmail, verified: true }
      })

      const user = (
        await listUsers({ query: '', limit: 10, cursor: null, role: null })
      )[0]
      expect(user.id).to.eq(userId)
      expect(user.email.toLowerCase()).to.eq(newEmail.toLowerCase())
      expect(user.verified).to.eq(true)
    })
  })

  describe('getUserByEmail', () => {
    it('should ignore email casing', async () => {
      const email = 'TeST@ExamPLE.oRg'
      await createUser({
        name: 'John Doe',
        password: createRandomPassword(),
        email
      })
      const user = await getUserByEmail(email)
      expect(user!.email).to.equal(email.toLowerCase())
    })
  })
})
