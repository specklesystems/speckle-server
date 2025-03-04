import assert from 'assert'
import { beforeEachContext } from '@/test/hooks'
import { ensureError, Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import {
  legacyGetPaginatedUsersFactory,
  legacyGetPaginatedUsersCountFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory,
  isLastAdminUserFactory,
  deleteUserRecordFactory,
  getUserRoleFactory,
  updateUserServerRoleFactory
} from '@/modules/core/repositories/users'
import { db } from '@/db/knex'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  createUserFactory,
  deleteUserFactory,
  changeUserRoleFactory
} from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  deleteAllUserInvitesFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import {
  deleteStreamFactory,
  getUserDeletableStreamsFactory
} from '@/modules/core/repositories/streams'
import { dbLogger } from '@/observability/logging'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { expect } from 'chai'

const getUsers = legacyGetPaginatedUsersFactory({ db })
const countUsers = legacyGetPaginatedUsersCountFactory({ db })

const getServerInfo = getServerInfoFactory({ db })
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
const deleteUser = deleteUserFactory({
  deleteStream: deleteStreamFactory({ db }),
  logger: dbLogger,
  isLastAdminUser: isLastAdminUserFactory({ db }),
  getUserDeletableStreams: getUserDeletableStreamsFactory({ db }),
  deleteAllUserInvites: deleteAllUserInvitesFactory({ db }),
  deleteUserRecord: deleteUserRecordFactory({ db }),
  emitEvent: getEventBus().emit
})
const getUserRole = getUserRoleFactory({ db })
const buildChangeUserRole = (guestModeEnabled = false) =>
  changeUserRoleFactory({
    getServerInfo: async () => ({ ...getServerInfo(), guestModeEnabled }),
    isLastAdminUser: isLastAdminUserFactory({ db }),
    updateUserServerRole: updateUserServerRoleFactory({ db })
  })
const changeUserRole = buildChangeUserRole()

describe('User admin @user-services', () => {
  const myTestActor = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  before(async () => {
    await beforeEachContext()

    const actorId = await createUser(myTestActor)
    myTestActor.id = actorId
  })

  it('First created user should be admin', async () => {
    const users = await getUsers(100, 0)
    expect(users).to.be.an('array')
    expect(users).to.have.lengthOf(1)
    const firstUser = users[0]

    const userRole = await getUserRole(firstUser.id)
    expect(userRole).to.equal(Roles.Server.Admin)
  })

  it('Count user knows how to count', async () => {
    expect(await countUsers()).to.equal(1)
    const newUser = { ...myTestActor }
    newUser.name = 'Bill Gates'
    newUser.email = 'bill@gates.com'
    newUser.password = 'testthebest'

    const actorId = await createUser(newUser)

    expect(await countUsers()).to.equal(2)

    await deleteUser(actorId)
    expect(await countUsers()).to.equal(1)
  })

  it('Get users query limit is sanitized to upper limit', async () => {
    const userInputs = Array(250)
      .fill(undefined)
      .map((v, i) => createNewDroid(i))

    expect(await countUsers()).to.equal(1)

    await Promise.all(userInputs.map((userInput) => createUser(userInput)))
    expect(await countUsers()).to.equal(251)

    const users = await getUsers(2000000)
    expect(users).to.have.lengthOf(200)
  }).timeout(10000)

  it('Get users offset is applied', async () => {
    const users = await getUsers(200, 200)
    expect(users).to.have.lengthOf(51)
  })

  it('User query filters', async () => {
    const users = await getUsers(100, 0, 'gergo')
    expect(users).to.have.lengthOf(1)
    const [user] = users
    expect(user.email).to.equal('gergo@jedlicska.com')
  })

  it('Count users applies query', async () => {
    expect(await countUsers('droid')).to.equal(250)
  })

  describe('changeUserRole', () => {
    it('throws for invalid role value', async () => {
      const role = 'shadow:lurker'
      try {
        await changeUserRole({ userId: myTestActor.id, role })
        assert.fail('This should have failed')
      } catch (err) {
        expect(ensureError(err).message).to.equal(`Invalid role specified: ${role}`)
      }
    })
    it('throws if guest role not enabled, but trying to change user role to guest', async () => {
      const role = Roles.Server.Guest
      try {
        await changeUserRole({ userId: myTestActor.id, role })
        assert.fail('This should have failed')
      } catch (err) {
        expect(ensureError(err).message).to.equal('Guest role is not enabled')
      }
    })
    it('modifies role', async () => {
      const userId = await createUser(
        createNewDroid(cryptoRandomString({ length: 13 }))
      )

      const oldRole = await getUserRole(userId)
      expect(oldRole).to.equal(Roles.Server.User)

      await changeUserRole({ userId, role: Roles.Server.Admin })
      let newRole = await getUserRole(userId)
      expect(newRole).to.equal(Roles.Server.Admin)

      await changeUserRole({ userId, role: Roles.Server.User })
      newRole = await getUserRole(userId)
      expect(newRole).to.equal(Roles.Server.User)

      await buildChangeUserRole(true)({
        userId,
        role: Roles.Server.Guest
      })
      newRole = await getUserRole(userId)
      expect(newRole).to.equal(Roles.Server.Guest)
    })
    it('Ensures at least one admin remains in the server', async () => {
      try {
        await changeUserRole({ userId: myTestActor.id, role: Roles.Server.User })
        assert.fail('This should have failed')
      } catch (err) {
        expect(ensureError(err).message).to.equal(
          'Cannot remove the last admin role from the server'
        )
      }
    })
  })
})

const createNewDroid = (number: string | number) => {
  return {
    name: `${number}`,
    email: `${number}@droidarmy.com`,
    password: 'sn3aky-1337-b1m'
  }
}
