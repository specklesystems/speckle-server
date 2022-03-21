/* istanbul ignore file */
const expect = require('chai').expect
const assert = require('assert')
const appRoot = require('app-root-path')

const {
  createUser,
  getUsers,
  countUsers,
  deleteUser,
  getUserRole,
  unmakeUserAdmin,
  makeUserAdmin
} = require('../services/users')
const { beforeEachContext } = require(`${appRoot}/test/hooks`)

describe('User admin @user-services', () => {
  let myTestActor = {
    name: 'Gergo Jedlicska',
    email: 'gergo@jedlicska.com',
    password: 'sn3aky-1337-b1m'
  }

  before(async () => {
    await beforeEachContext()

    let actorId = await createUser(myTestActor)
    myTestActor.id = actorId
  })

  it('First created user should be admin', async () => {
    let users = await getUsers(100, 0)
    expect(users).to.be.an('array')
    expect(users).to.have.lengthOf(1)
    let firstUser = users[0]

    let userRole = await getUserRole(firstUser.id)
    expect(userRole).to.equal('server:admin')
  })

  it('Count user knows how to count', async () => {
    expect(await countUsers()).to.equal(1)
    let newUser = { ...myTestActor }
    newUser.name = 'Bill Gates'
    newUser.email = 'bill@gates.com'
    newUser.password = 'testthebest'

    let actorId = await createUser(newUser)

    expect(await countUsers()).to.equal(2)

    await deleteUser(actorId)
    expect(await countUsers()).to.equal(1)
  })

  it('Get users query limit is sanitized to upper limit', async () => {
    let createNewDroid = (number) => {
      return {
        name: `${number}`,
        email: `${number}@droidarmy.com`,
        password: 'sn3aky-1337-b1m'
      }
    }

    let userInputs = Array(250)
      .fill()
      .map((v, i) => createNewDroid(i))

    expect(await countUsers()).to.equal(1)

    await Promise.all(userInputs.map((userInput) => createUser(userInput)))
    expect(await countUsers()).to.equal(251)

    let users = await getUsers(2000000)
    expect(users).to.have.lengthOf(200)
  }).timeout(10000)

  it('Get users offset is applied', async () => {
    let users = await getUsers(200, 200)
    expect(users).to.have.lengthOf(51)
  })

  it('User query filters', async () => {
    let users = await getUsers(100, 0, 'gergo')
    expect(users).to.have.lengthOf(1)
    let [user] = users
    expect(user.email).to.equal('gergo@jedlicska.com')
  })

  it('Count users applies query', async () => {
    expect(await countUsers('droid')).to.equal(250)
  })

  it('Change user role modifies role', async () => {
    let [user] = await getUsers(1, 10)

    let oldRole = await getUserRole(user.id)
    expect(oldRole).to.equal('server:user')

    await makeUserAdmin({ userId: user.id })
    let newRole = await getUserRole(user.id)
    expect(newRole).to.equal('server:admin')

    await unmakeUserAdmin({ userId: user.id })
    newRole = await getUserRole(user.id)
    expect(newRole).to.equal('server:user')
  })

  it('Ensure at least one admin remains in the server', async () => {
    try {
      await unmakeUserAdmin({ userId: myTestActor.id, role: 'server:admin' })
      assert.fail('This should have failed')
    } catch (err) {
      expect(err.message).to.equal('Cannot remove the last admin role from the server')
    }
  })
})
