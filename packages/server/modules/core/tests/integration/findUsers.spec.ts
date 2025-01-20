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
  bulkLookupUsersFactory,
  countAdminUsersFactory,
  getUserByEmailFactory,
  getUserFactory,
  getUsersFactory,
  listUsersFactory,
  lookupUsersFactory,
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
import {
  getServerConfigFactory,
  getServerInfoFactory
} from '@/modules/core/repositories/server'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'

const getServerInfo = getServerInfoFactory({
  getServerConfig: getServerConfigFactory({ db })
})
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
  emitEvent: getEventBus().emit
})
const getUserByEmail = getUserByEmailFactory({ db })
const listUsers = listUsersFactory({ db })
const lookupUsers = lookupUsersFactory({ db })
const bulkLookupUsers = bulkLookupUsersFactory({ db })

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

  describe('lookupUsers', () => {
    it('should find matches by name', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        email,
        name: 'John Spackle',
        password: createRandomPassword()
      })
      const { users } = await lookupUsers({ query: 'Spack' })
      expect(users.some((user) => user.id === userId)).to.equal(true)
    })
    it('should not find matches by name if filtered to emails only', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        email,
        name: 'John Spackle',
        password: createRandomPassword()
      })
      const { users } = await lookupUsers({ query: 'Spack', emailOnly: true })
      expect(users.some((user) => user.id === userId)).to.equal(false)
    })
    it('should find matches by email', async () => {
      const email = createRandomEmail()
      const userId = await createUser({
        email,
        name: 'John Spackle',
        password: createRandomPassword()
      })
      const { users } = await lookupUsers({ query: email })
      expect(users.some((user) => user.id === userId)).to.equal(true)
    })
    it('should find matches by email, case insensitive', async () => {
      const email = 'fooBAR@example.org'
      const userId = await createUser({
        email,
        name: 'John Spackle',
        password: createRandomPassword()
      })
      const { users } = await lookupUsers({ query: 'FoObAr@example.org' })
      expect(users.some((user) => user.id === userId)).to.equal(true)
    })
    it('should find matches limited to the given project', async () => {
      const userA: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Beatrice'
      }
      const userB: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Beatrice'
      }
      await createTestUser(userA)
      await createTestUser(userB)
      const project: BasicTestStream = {
        id: '',
        ownerId: '',
        name: 'Test Project',
        isPublic: false
      }
      await createTestStream(project, userA)

      const { users } = await lookupUsers({ query: 'beatrice', projectId: project.id })
      expect(users.some((user) => user.id === userA.id)).to.equal(true)
      expect(users.some((user) => user.id === userB.id)).to.equal(false)
    })
  })

  describe('bulkLookupUsers', () => {
    it('should find matches for all emails provided', async () => {
      const userA: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Harald'
      }
      const userB: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Beatrice'
      }
      await createTestUser(userA)
      await createTestUser(userB)

      const users = await bulkLookupUsers({ emails: [userA.email, userB.email] })

      expect(users.length).to.equal(2)
      expect(users.some((user) => user?.id === userA.id)).to.equal(true)
      expect(users.some((user) => user?.id === userB.id)).to.equal(true)
    })
    it('should return matches in the same order they were provided', async () => {
      const userA: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Barald'
      }
      const userB: BasicTestUser = {
        id: '',
        email: createRandomEmail(),
        name: 'Heatrice'
      }
      await createTestUser(userA)
      await createTestUser(userB)

      const users = await bulkLookupUsers({ emails: [userB.email, userA.email] })

      expect(users[0]?.id).to.equal(userB.id)
      expect(users[1]?.id).to.equal(userA.id)
    })
    it('should find matches for all emails provided, case insensitive', async () => {
      const testUser: BasicTestUser = {
        id: '',
        email: 'barBAZ@example.org',
        name: 'Bonathon'
      }
      await createTestUser(testUser)

      const users = await bulkLookupUsers({ emails: ['BARbaz@example.org'] })

      expect(users.length).to.equal(1)
      expect(users.some((user) => user?.id === testUser.id)).to.equal(true)
    })
    it('should return null for positions where email matched no user', async () => {
      const testEmail = createRandomEmail()
      const testUser: BasicTestUser = {
        id: '',
        email: testEmail,
        name: 'MICHAEL'
      }
      await createTestUser(testUser)

      const users = await bulkLookupUsers({
        emails: [createRandomEmail(), testEmail, createRandomEmail()]
      })

      expect(users.length).to.equal(3)
      expect(users[0]).to.equal(null)
      expect(users[1]?.id).to.equal(testUser.id)
      expect(users[2]).to.equal(null)
    })
  })
})
