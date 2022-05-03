/* istanbul ignore file */
const bcrypt = require('bcrypt')
const crs = require('crypto-random-string')
const expect = require('chai').expect
const assert = require('assert')

const knex = require('@/db/knex')

const {
  archiveUser,
  createUser,
  findOrCreateUser,
  getUser,
  getUserByEmail,
  searchUsers,
  updateUser,
  deleteUser,
  validatePasssword,
  updateUserPassword
} = require('../services/users')
const {
  createPersonalAccessToken,
  revokeToken,
  validateToken,
  getUserTokens
} = require('../services/tokens')
const {
  grantPermissionsStream,
  createStream,
  getStream
} = require('../services/streams')

const { createBranch, getBranchesByStreamId } = require('../services/branches')

const {
  createCommitByBranchName,
  getCommitsByBranchName,
  getCommitById,
  getCommitsByStreamId
} = require('../services/commits')

const { createObject } = require('../services/objects')
const { beforeEachContext } = require('@/test/hooks')

describe('Actors & Tokens @user-services', () => {
  const myTestActor = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  before(async () => {
    await beforeEachContext()

    const actorId = await createUser(myTestActor)
    myTestActor.id = actorId
  })

  describe('Users @core-users', () => {
    it('Should create an user', async () => {
      const newUser = { ...myTestActor }
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.password = 'testthebest'

      const actorId = await createUser(newUser)
      newUser.id = actorId

      expect(actorId).to.be.a('string')
    })

    it('Should store user email lowercase', async () => {
      const user = {
        name: 'Marty McFly',
        email: 'Marty@Mc.Fly',
        password: 'something_future_proof'
      }

      const userId = await createUser(user)

      const storedUser = await getUser(userId)
      expect(storedUser.email).to.equal(user.email.toLowerCase())
    })

    it('Get user by should ignore email casing', async () => {
      const user = await getUserByEmail({ email: 'BiLL@GaTES.cOm' })
      expect(user.email).to.equal('bill@gates.com')
    })

    it('Validate password should ignore email casing', async () => {
      expect(
        await validatePasssword({ email: 'BiLL@GaTES.cOm', password: 'testthebest' })
      )
    })

    it('Should not create a user with a too small password', async () => {
      try {
        await createUser({
          name: 'Dim Sum',
          email: 'dim@gmail.com',
          password: '1234567'
        })
      } catch (e) {
        return
      }
      assert.fail('short pwd')
    })

    it('Should still find previously stored non lowercase emails', async () => {
      const email = 'Dim@gMail.cOm'
      const user = { name: 'Dim Sum', email, password: '1234567' }
      user.id = crs({ length: 10 })
      user.passwordDigest = await bcrypt.hash(user.password, 10)
      delete user.password

      const [{ id: userId }] = await knex('users').returning('id').insert(user)

      const userByEmail = await getUserByEmail({ email })
      expect(userByEmail).to.not.be.null
      expect(userByEmail.email).to.equal(email)
      expect(userByEmail.id).to.equal(userId)

      const userByLowerEmail = await getUserByEmail({ email: email.toLowerCase() })
      expect(userByLowerEmail).to.not.be.null
      expect(userByLowerEmail.email).to.equal(email)
      expect(user.id).to.equal(userId)

      user.email = user.email.toLowerCase()
      const foundNotCreatedUser = await findOrCreateUser({ user })
      expect(foundNotCreatedUser.id).to.equal(userId)
    })

    it('Should not create an user with the same email', async () => {
      const newUser = {}
      newUser.name = 'Bill Gates'
      newUser.email = 'bill@gates.com'
      newUser.password = 'testthebest'

      await createUser(newUser)
        .then(() => {
          throw new Error('This should have failed with duplicate email error')
        })
        .catch((err) => {
          expect(err.message).to.equal('Email taken. Try logging in?')
        })
    })

    let ballmerUserId = null

    it('Find or create should create a user', async () => {
      const newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'

      const { id } = await findOrCreateUser({ user: newUser })
      ballmerUserId = id
      expect(id).to.be.a('string')
    })

    it('Find or create should NOT create a user', async () => {
      const newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@balls.com'
      newUser.password = 'testthebest'
      newUser.suuid = 'really it does not matter'

      const { id } = await findOrCreateUser({ user: newUser })
      expect(id).to.equal(ballmerUserId)
    })

    // Note: deletion is more complicated.
    it('Should delete a user', async () => {
      const soloOwnerStream = {
        name: 'Test Stream 01',
        description: 'wonderful test stream',
        isPublic: true
      }
      const multiOwnerStream = {
        name: 'Test Stream 02',
        description: 'another test stream',
        isPublic: true
      }

      soloOwnerStream.id = await createStream({
        ...soloOwnerStream,
        ownerId: ballmerUserId
      })
      multiOwnerStream.id = await createStream({
        ...multiOwnerStream,
        ownerId: ballmerUserId
      })

      await grantPermissionsStream({
        streamId: multiOwnerStream.id,
        userId: myTestActor.id,
        role: 'stream:owner'
      })

      // create a branch for ballmer on the multiowner stream
      const branch = { name: 'ballmer/dev' }
      branch.id = await createBranch({
        ...branch,
        streamId: multiOwnerStream.id,
        authorId: ballmerUserId
      })

      const branchSecond = { name: 'steve/jobs' }
      branchSecond.id = await createBranch({
        ...branchSecond,
        streamId: multiOwnerStream.id,
        authorId: myTestActor.id
      })

      // create an object and a commit around it on the multiowner stream
      const objId = await createObject(multiOwnerStream.id, { pie: 'in the sky' })
      const commitId = await createCommitByBranchName({
        streamId: multiOwnerStream.id,
        branchName: 'ballmer/dev',
        message: 'breakfast commit',
        sourceApplication: 'tests',
        objectId: objId,
        authorId: ballmerUserId
      })

      await deleteUser(ballmerUserId)

      if ((await getStream({ streamId: soloOwnerStream.id })) !== undefined) {
        assert.fail('user stream not deleted')
      }

      const multiOwnerStreamCopy = await getStream({ streamId: multiOwnerStream.id })
      if (!multiOwnerStreamCopy || multiOwnerStreamCopy.id !== multiOwnerStream.id) {
        assert.fail('shared stream deleted')
      }

      const branches = await getBranchesByStreamId({ streamId: multiOwnerStream.id })
      expect(branches.items.length).to.equal(3)

      const branchCommits = await getCommitsByBranchName({
        streamId: multiOwnerStream.id,
        branchName: 'ballmer/dev'
      })
      expect(branchCommits.commits.length).to.equal(1)

      const commit = await getCommitById({
        streamId: multiOwnerStream.id,
        id: commitId
      })
      expect(commit).to.be.not.null

      const commitsByStreamId = await getCommitsByStreamId({
        streamId: multiOwnerStream.id
      })
      expect(commitsByStreamId.commits.length).to.equal(1)

      const user = await getUser(ballmerUserId)
      if (user) assert.fail('user not deleted')
    })

    it('Should not delete the last admin user', async () => {
      try {
        await deleteUser(myTestActor.id)
        assert.fail('boom')
      } catch (err) {
        expect(err.message).to.equal(
          'Cannot remove the last admin role from the server'
        )
      }
    })

    it('Should get a user', async () => {
      const actor = await getUser(myTestActor.id)
      expect(actor).to.not.have.property('passwordDigest')
    })

    it('Should search and get users', async () => {
      const { users } = await searchUsers('gates', 20, null)
      expect(users).to.have.lengthOf(1)
      expect(users[0].name).to.equal('Bill Gates')
    })

    it('Should not search for archived users unless explicitly asked', async () => {
      const toBeArchivedId = await createUser({
        name: 'Miss Library Lady',
        email: 'will@be.archived',
        password: 'ilikebooks'
      })

      await createUser({
        name: 'Not in the Library',
        email: 'i@will.survive',
        password: 'nanananananaaaa'
      })

      await archiveUser({ userId: toBeArchivedId })

      let { users } = await searchUsers('Library', 20, null)
      expect(users).to.have.lengthOf(1)

      users = (await searchUsers('Library', 20, null, true)).users
      expect(users).to.have.lengthOf(2)
    })

    it('Should update a user', async () => {
      const updatedActor = { ...myTestActor }
      updatedActor.name = 'didimitrie'

      await updateUser(myTestActor.id, updatedActor)

      const actor = await getUser(myTestActor.id)
      expect(actor.name).to.equal(updatedActor.name)
    })

    it('Should not update password', async () => {
      const updatedActor = { ...myTestActor }
      updatedActor.password = 'failwhale'

      await updateUser(myTestActor.id, updatedActor)

      const match = await validatePasssword({
        email: myTestActor.email,
        password: 'failwhale'
      })
      expect(match).to.equal(false)
    })

    it('Should validate user password', async () => {
      const actor = {}
      actor.password = 'super-test-200'
      actor.email = 'e@ma.il'
      actor.name = 'Bob Gates'

      await createUser(actor)

      const match = await validatePasssword({
        email: actor.email,
        password: 'super-test-200'
      })
      expect(match).to.equal(true)
      const matchWrong = await validatePasssword({
        email: actor.email,
        password: 'super-test-2000'
      })
      expect(matchWrong).to.equal(false)
    })

    it('Should update the password of a user', async () => {
      const id = await createUser({
        name: 'D',
        email: 'tester@mcbester.com',
        password: 'H4!b5at+kWls-8yh4Guq'
      }) // https://mostsecure.pw
      await updateUserPassword({ id, newPassword: 'Hello Dogs and Cats' })

      const match = await validatePasssword({
        email: 'tester@mcbester.com',
        password: 'Hello Dogs and Cats'
      })
      expect(match).to.equal(true)
    })
  })

  describe('API Tokens @core-apitokens', () => {
    let myFirstToken
    let pregeneratedToken
    let revokedToken
    let expireSoonToken

    before(async () => {
      pregeneratedToken = await createPersonalAccessToken(myTestActor.id, 'Whabadub', [
        'streams:read',
        'streams:write',
        'profile:read',
        'users:email'
      ])
      revokedToken = await createPersonalAccessToken(myTestActor.id, 'Mr. Revoked', [
        'streams:read'
      ])
      expireSoonToken = await createPersonalAccessToken(
        myTestActor.id,
        'Mayfly',
        ['streams:read'],
        1
      ) // 1ms lifespan
    })

    it('Should create a personal api token', async () => {
      const scopes = ['streams:write', 'profile:read']
      const name = 'My Test Token'

      myFirstToken = await createPersonalAccessToken(myTestActor.id, name, scopes)
      expect(myFirstToken).to.have.lengthOf(42)
    })

    // it( 'Should create an api token for an app', async ( ) => {
    //   let test = await createAppToken( { userId: myTestActor.id, appId: 'spklwebapp' } )
    //   expect( test ).to.have.lengthOf( 42 )
    // } )

    it('Should validate a token', async () => {
      const res = await validateToken(pregeneratedToken)
      expect(res).to.have.property('valid')
      expect(res.valid).to.equal(true)
      expect(res).to.have.property('scopes')
      expect(res).to.have.property('userId')
      expect(res).to.have.property('role')
    })

    it('Should revoke an api token', async () => {
      await revokeToken(revokedToken, myTestActor.id)
      const res = await validateToken(revokedToken)
      expect(res).to.have.property('valid')
      expect(res.valid).to.equal(false)
    })

    it('Should refuse an expired token', async () => {
      const res = await validateToken(expireSoonToken)
      expect(res.valid).to.equal(false)
      // assert.fail( )
    })

    it('Should get the tokens of an user', async () => {
      const userTokens = await getUserTokens(myTestActor.id)
      expect(userTokens).to.be.an('array')
      expect(userTokens).to.have.lengthOf(2)
    })
  })
})
