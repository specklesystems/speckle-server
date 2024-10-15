/* istanbul ignore file */
const expect = require('chai').expect
const assert = require('assert')

const {
  changeUserRole,
  createUser,
  findOrCreateUser,
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

const { getBranchesByStreamId } = require('../services/branches')

const { getCommitsByBranchName, getCommitsByStreamId } = require('../services/commits')

const { createObject } = require('../services/objects')
const { beforeEachContext } = require('@/test/hooks')
const { Scopes, Roles } = require('@speckle/shared')
const { createRandomEmail } = require('../helpers/testHelpers')
const {
  createBranchFactory,
  getBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getStreamBranchByNameFactory
} = require('@/modules/core/repositories/branches')
const { db } = require('@/db/knex')
const {
  getCommitFactory,
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
} = require('@/modules/core/repositories/commits')
const {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} = require('@/modules/core/services/commit/management')
const {
  getStreamFactory,
  createStreamFactory,
  grantStreamPermissionsFactory,
  markCommitStreamUpdatedFactory
} = require('@/modules/core/repositories/streams')
const { VersionsEmitter } = require('@/modules/core/events/versionsEmitter')
const { getObjectFactory } = require('@/modules/core/repositories/objects')
const {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} = require('@/modules/core/services/streams/management')
const {
  inviteUsersToProjectFactory
} = require('@/modules/serverinvites/services/projectInviteManagement')
const {
  createAndSendInviteFactory
} = require('@/modules/serverinvites/services/creation')
const {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  addStreamCreatedActivityFactory
} = require('@/modules/activitystream/services/streamActivity')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')
const {
  addCommitCreatedActivityFactory
} = require('@/modules/activitystream/services/commitActivity')
const {
  getUsersFactory,
  getUserFactory,
  legacyGetUserFactory
} = require('@/modules/core/repositories/users')

const getUser = legacyGetUserFactory({ db })
const getUsers = getUsersFactory({ db })
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db })
const createBranch = createBranchFactory({ db })
const getCommit = getCommitFactory({ db })

const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  versionsEventEmitter: VersionsEmitter.emit,
  addCommitCreatedActivity: addCommitCreatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const addStreamCreatedActivity = addStreamCreatedActivityFactory({
  saveActivity: saveActivityFactory({ db }),
  publish
})
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory({ db }),
        insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
        collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
          getStream
        }),
        buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
          getStream
        }),
        emitEvent: ({ eventName, payload }) =>
          getEventBus().emit({
            eventName,
            payload
          }),
        getUser: getUserFactory({ db })
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})
const grantPermissionsStream = grantStreamPermissionsFactory({ db })

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
    it('Get user by should ignore email casing', async () => {
      await createUser({
        name: 'John Doe',
        password: 'sn3aky-1337-b1m',
        email: 'test@example.org'
      })
      const user = await getUserByEmail({ email: 'TeST@ExamPLE.oRg' })
      expect(user.email).to.equal('test@example.org')
    })

    it('Validate password should ignore email casing', async () => {
      expect(
        await validatePasssword({ email: 'BiLL@GaTES.cOm', password: 'testthebest' })
      )
    })

    let ballmerUserId = null

    it('Find or create should create a user', async () => {
      const newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@example.test'
      newUser.password = 'testthebest'

      const { id } = await findOrCreateUser({ user: newUser })
      ballmerUserId = id
      expect(id).to.be.a('string')
      const user = await getUser(id)
      expect(user.verified).to.equal(true)
    })

    it('Find or create should NOT create a user', async () => {
      const newUser = {}
      newUser.name = 'Steve Ballmer Balls'
      newUser.email = 'ballmer@example.test'
      newUser.password = 'testthebest'

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
        role: Roles.Stream.Owner
      })

      // create a branch for ballmer on the multiowner stream
      const branch = { name: 'ballmer/dev' }
      branch.id = (
        await createBranch({
          ...branch,
          streamId: multiOwnerStream.id,
          authorId: ballmerUserId
        })
      ).id

      const branchSecond = { name: 'steve/jobs' }
      branchSecond.id = (
        await createBranch({
          ...branchSecond,
          streamId: multiOwnerStream.id,
          authorId: myTestActor.id
        })
      ).id

      // create an object and a commit around it on the multiowner stream
      const objId = await createObject({
        streamId: multiOwnerStream.id,
        object: { pie: 'in the sky' }
      })
      const commitId = (
        await createCommitByBranchName({
          streamId: multiOwnerStream.id,
          branchName: 'ballmer/dev',
          message: 'breakfast commit',
          sourceApplication: 'tests',
          objectId: objId,
          authorId: ballmerUserId
        })
      ).id

      await deleteUser({ deleteAllUserInvites: async () => true })(ballmerUserId)

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

      const commit = await getCommit(commitId, { streamId: multiOwnerStream.id })
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
        await deleteUser({ deleteAllUserInvites: async () => true })(myTestActor.id)
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
      const email = createRandomEmail()
      await createUser({
        name: 'Bill Gates',
        password: 'sn3aky-1337-b1m',
        email
      })
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

      await changeUserRole({ userId: toBeArchivedId, role: Roles.Server.ArchivedUser })

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
        Scopes.Streams.Read,
        Scopes.Streams.Write,
        Scopes.Profile.Read,
        Scopes.Users.Email
      ])
      revokedToken = await createPersonalAccessToken(myTestActor.id, 'Mr. Revoked', [
        Scopes.Streams.Read
      ])
      expireSoonToken = await createPersonalAccessToken(
        myTestActor.id,
        'Mayfly',
        [Scopes.Streams.Read],
        1
      ) // 1ms lifespan
    })

    it('Should create a personal api token', async () => {
      const scopes = [Scopes.Streams.Write, Scopes.Profile.Read]
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
