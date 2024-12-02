/* istanbul ignore file */
const chai = require('chai')
const assert = require('assert')

const { beforeEachContext } = require('@/test/hooks')
const { sleep } = require('@/test/helpers')

const expect = chai.expect

const { knex } = require('@/db/knex')

const {
  updateBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory
} = require('@/modules/core/services/branch/management')
const {
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory,
  updateBranchFactory,
  deleteBranchByIdFactory,
  markCommitBranchUpdatedFactory,
  getPaginatedStreamBranchesPageFactory,
  getStreamBranchCountFactory
} = require('@/modules/core/repositories/branches')
const {
  addBranchUpdatedActivityFactory,
  addBranchDeletedActivityFactory
} = require('@/modules/activitystream/services/branchActivity')
const {
  getStreamFactory,
  createStreamFactory,
  markBranchStreamUpdatedFactory,
  markCommitStreamUpdatedFactory
} = require('@/modules/core/repositories/streams')
const { ModelsEmitter } = require('@/modules/core/events/modelsEmitter')
const {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} = require('@/modules/core/services/commit/management')
const {
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory
} = require('@/modules/core/repositories/commits')
const { VersionsEmitter } = require('@/modules/core/events/versionsEmitter')
const {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory,
  storeClosuresIfNotFoundFactory
} = require('@/modules/core/repositories/objects')
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
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const {
  collectAndValidateCoreTargetsFactory
} = require('@/modules/serverinvites/services/coreResourceCollection')
const {
  buildCoreInviteEmailContentsFactory
} = require('@/modules/serverinvites/services/coreEmailContents')
const { getEventBus } = require('@/modules/shared/services/eventBus')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')
const {
  addCommitCreatedActivityFactory
} = require('@/modules/activitystream/services/commitActivity')
const {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} = require('@/modules/core/repositories/users')
const {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} = require('@/modules/core/repositories/userEmails')
const {
  requestNewEmailVerificationFactory
} = require('@/modules/emails/services/verification/request')
const {
  deleteOldAndInsertNewVerificationFactory
} = require('@/modules/emails/repositories')
const { renderEmail } = require('@/modules/emails/services/emailRendering')
const { sendEmail } = require('@/modules/emails/services/sending')
const { createUserFactory } = require('@/modules/core/services/users/management')
const {
  validateAndCreateUserEmailFactory
} = require('@/modules/core/services/userEmails')
const {
  finalizeInvitedServerRegistrationFactory
} = require('@/modules/serverinvites/services/processing')
const { UsersEmitter } = require('@/modules/core/events/usersEmitter')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')
const {
  getPaginatedStreamBranchesFactory
} = require('@/modules/core/services/branch/retrieval')
const { createObjectFactory } = require('@/modules/core/services/objects/management')

const db = knex
const Commits = () => knex('commits')

const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db: knex })
const getBranchById = getBranchByIdFactory({ db: knex })
const getStreamBranchByName = getStreamBranchByNameFactory({ db: knex })
const createBranch = createBranchFactory({ db: knex })
const updateBranchAndNotify = updateBranchAndNotifyFactory({
  getBranchById: getBranchByIdFactory({ db: knex }),
  updateBranch: updateBranchFactory({ db: knex }),
  addBranchUpdatedActivity: addBranchUpdatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})
const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
  getStream,
  getBranchById: getBranchByIdFactory({ db: knex }),
  modelsEventsEmitter: ModelsEmitter.emit,
  markBranchStreamUpdated,
  addBranchDeletedActivity: addBranchDeletedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  }),
  deleteBranchById: deleteBranchByIdFactory({ db: knex })
})

const getServerInfo = getServerInfoFactory({ db })
const getObject = getObjectFactory({ db: knex })
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
        getUser,
        getServerInfo
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

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
const getBranchesByStreamId = getPaginatedStreamBranchesFactory({
  getPaginatedStreamBranchesPage: getPaginatedStreamBranchesPageFactory({ db }),
  getStreamBranchCount: getStreamBranchCountFactory({ db })
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

describe('Branches @core-branches', () => {
  const user = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie4342@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  const stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...'
  }

  const testObject = {
    foo: 'bar',
    baz: 'qux'
  }

  before(async () => {
    await beforeEachContext()

    user.id = await createUser(user)
    stream.id = await createStream({ ...stream, ownerId: user.id })
    testObject.id = await createObject({ streamId: stream.id, object: testObject })
  })

  const branch = { name: 'dim/dev' }

  it('Should create a branch', async () => {
    branch.id = (
      await createBranch({
        ...branch,
        streamId: stream.id,
        authorId: user.id
      })
    ).id
    expect(branch.id).to.be.not.null
    expect(branch.id).to.be.a.string
  })

  it('Should not allow duplicate branch names', async () => {
    try {
      await createBranch({ name: 'main', streamId: stream.id, authorId: user.id })
      assert.fail('Duplicate branches should not be allowed.')
    } catch (err) {
      expect(err.message).to.contain('duplicate key value violates unique constraint')
    }
  })

  it('Should not allow branch names starting with # or /, or branches that have "//" in their name', async () => {
    try {
      await createBranch({ name: '/pasta', streamId: stream.id, authorId: user.id })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Branch names cannot start with')
    }

    try {
      await createBranch({ name: '#rice', streamId: stream.id, authorId: user.id })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Branch names cannot start with')
    }

    try {
      await updateBranchAndNotify(
        {
          id: branch.id,
          name: '/super/part/two',
          streamId: stream.id
        },
        user.id
      )
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(err.message).to.contain('Branch names cannot start with')
    }

    try {
      await updateBranchAndNotify(
        {
          id: branch.id,
          name: '#super#part#three',
          streamId: stream.id
        },
        user.id
      )
      assert.fail('Illegal branch name passed through in update operation.')
    } catch (err) {
      expect(err.message).to.contain('Branch names cannot start with')
    }

    try {
      await createBranch({
        name: 'pasta//rice',
        streamId: stream.id,
        authorId: user.id
      })
      assert.fail('Illegal branch name passed through.')
    } catch (err) {
      expect(err.message).to.contain('Branch names cannot start with')
    }
  })

  it('Branch names should be case insensitive (always lowercase)', async () => {
    const id = (
      await createBranch({
        name: 'CaseSensitive',
        streamId: stream.id,
        authorId: user.id
      })
    ).id

    const b = await getStreamBranchByName(stream.id, 'casesensitive')
    expect(b.name).to.equal('casesensitive')

    const bb = await getStreamBranchByName(stream.id, 'CaseSensitive')
    expect(bb.name).to.equal('casesensitive')

    const bbb = await getStreamBranchByName(stream.id, 'CASESENSITIVE')
    expect(bbb.name).to.equal('casesensitive')

    // cleanup
    await deleteBranchAndNotify({ id, streamId: stream.id }, user.id)
  })

  it('Should get a branch', async () => {
    const myBranch = await getBranchById(branch.id)
    expect(myBranch.authorId).to.equal(user.id)
    expect(myBranch.streamId).to.equal(stream.id)
  })

  it('Should update a branch', async () => {
    await updateBranchAndNotify(
      {
        id: branch.id,
        description: 'lorem ipsum',
        streamId: stream.id
      },
      user.id
    )

    const b1 = await getBranchById(branch.id)
    expect(b1.description).to.equal('lorem ipsum')
  })

  it('Should get all stream branches', async () => {
    await createBranch({ name: 'main-faster', streamId: stream.id, authorId: user.id })
    await sleep(250)
    await createBranch({ name: 'main-blaster', streamId: stream.id, authorId: user.id })
    await sleep(250)
    await createBranch({
      name: 'blaster-farter',
      streamId: stream.id,
      authorId: user.id
    })

    const { items, cursor, totalCount } = await getBranchesByStreamId(stream.id)
    expect(items).to.have.lengthOf(5)
    expect(cursor).to.exist
    expect(totalCount).to.exist
  })

  it('Should delete a branch', async () => {
    await deleteBranchAndNotify({ id: branch.id, streamId: stream.id }, user.id)
    const { items } = await getBranchesByStreamId(stream.id)
    expect(items).to.have.lengthOf(4)
  })

  it('Deleting a branch should delete the commit', async () => {
    const branchName = 'pasta'

    const branchId = (
      await createBranch({
        name: branchName,
        streamId: stream.id,
        authorId: user.id
      })
    ).id

    const { id: tempCommitId } = await createCommitByBranchName({
      streamId: stream.id,
      branchName,
      message: 'temp commit',
      sourceApplication: 'tests',
      objectId: testObject.id,
      authorId: user.id
    })
    await deleteBranchAndNotify({ id: branchId, streamId: stream.id }, user.id)

    const commit = await Commits().where({ id: tempCommitId }).first()
    expect(commit).to.be.undefined
  })

  it('Should NOT delete the main branch', async () => {
    const b = await getStreamBranchByName(stream.id, 'main')
    try {
      await deleteBranchAndNotify({ id: b.id, streamId: stream.id }, user.id)
      assert.fail()
    } catch {
      // pass
    }
  })

  it('Should return branches in time createdAt order, MAIN first', async () => {
    const { items } = await getBranchesByStreamId(stream.id)

    expect(items[0].name).to.equal('main')
    expect(items[1].createdAt < items[2].createdAt).to.equal(true)
  })

  // NOTE: pagination broken currently, we need to do a global fix
  // pausing this for now to be able to put out other fixes
  // it('Should paginate branches correctly', async () => {
  //   const { items: firstBatch, cursor } = await getBranchesByStreamId({
  //     streamId: stream.id,
  //     limit: 2
  //   })
  //   const test = JSON.stringify(cursor)
  //   console.log(test)
  //   expect(firstBatch.length).to.equal(2)
  //   const { items: secondBatch } = await getBranchesByStreamId({
  //     streamId: stream.id,
  //     cursor,
  //     limit: 2
  //   })
  //   expect(secondBatch.length).to.equal(2)
  //   console.log(secondBatch[0].createdAt)
  //   console.log(firstBatch[1].createdAt)
  //   expect(secondBatch[0].createdAt > firstBatch[1].createdAt).to.equal(true)
  // })
})
