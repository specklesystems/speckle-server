const expect = require('chai').expect
const assert = require('assert')

const {
  createUser,

  deleteUser,
  changeUserRole,
  getUserRole
} = require('@/modules/core/services/users')
const { beforeEachContext } = require('@/test/hooks')
const { Roles } = require('@speckle/shared')
const cryptoRandomString = require('crypto-random-string')
const {
  legacyGetPaginatedUsersFactory,
  legacyGetPaginatedUsersCount
} = require('@/modules/core/repositories/users')
const { db } = require('@/db/knex')

const getUsers = legacyGetPaginatedUsersFactory({ db })
const countUsers = legacyGetPaginatedUsersCount({ db })

describe('User admin @user-services', () => {
  const myTestActor = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m'
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

    await deleteUser({ deleteAllUserInvites: async () => true })(actorId)
    expect(await countUsers()).to.equal(1)
  })

  it('Get users query limit is sanitized to upper limit', async () => {
    const userInputs = Array(250)
      .fill()
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
        expect(err.message).to.equal(`Invalid role specified: ${role}`)
      }
    })
    it('throws if guest role not enabled, but trying to change user role to guest', async () => {
      const role = Roles.Server.Guest
      try {
        await changeUserRole({ userId: myTestActor.id, role })
        assert.fail('This should have failed')
      } catch (err) {
        expect(err.message).to.equal('Guest role is not enabled')
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

      await changeUserRole({
        userId,
        role: Roles.Server.Guest,
        guestModeEnabled: true
      })
      newRole = await getUserRole(userId)
      expect(newRole).to.equal(Roles.Server.Guest)
    })
    it('Ensures at least one admin remains in the server', async () => {
      try {
        await changeUserRole({ userId: myTestActor.id, role: Roles.Server.User })
        assert.fail('This should have failed')
      } catch (err) {
        expect(err.message).to.equal(
          'Cannot remove the last admin role from the server'
        )
      }
    })
  })
})

const createNewDroid = (number) => {
  return {
    name: `${number}`,
    email: `${number}@droidarmy.com`,
    password: 'sn3aky-1337-b1m'
  }
}
