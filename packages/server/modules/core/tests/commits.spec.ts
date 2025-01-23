/* istanbul ignore file */
import { expect } from 'chai'

import { beforeEachContext } from '@/test/hooks'

import { createBranchAndNotifyFactory } from '@/modules/core/services/branch/management'
import cryptoRandomString from 'crypto-random-string'
import {
  createBranchFactory,
  getStreamBranchByNameFactory,
  markCommitBranchUpdatedFactory,
  getBranchByIdFactory
} from '@/modules/core/repositories/branches'
import { db } from '@/db/knex'
import {
  getCommitFactory,
  deleteCommitFactory,
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory,
  getCommitBranchFactory,
  switchCommitBranchFactory,
  updateCommitFactory,
  getStreamCommitCountFactory,
  legacyGetPaginatedUserCommitsPage,
  legacyGetPaginatedStreamCommitsPageFactory,
  getBranchCommitsTotalCountFactory,
  getPaginatedBranchCommitsItemsFactory
} from '@/modules/core/repositories/commits'
import {
  deleteCommitAndNotifyFactory,
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory,
  updateCommitAndNotifyFactory
} from '@/modules/core/services/commit/management'
import {
  getStreamFactory,
  getCommitStreamFactory,
  createStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getObjectFactory,
  storeSingleObjectIfNotFoundFactory,
  storeClosuresIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  legacyCreateStreamFactory,
  createStreamReturnRecordFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { publish } from '@/modules/shared/utils/subscriptions'
import {
  getUsersFactory,
  getUserFactory,
  storeUserFactory,
  countAdminUsersFactory,
  storeUserAclFactory
} from '@/modules/core/repositories/users'
import {
  findEmailFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getBranchCommitsTotalCountByNameFactory,
  getPaginatedBranchCommitsItemsByNameFactory
} from '@/modules/core/services/commit/retrieval'
import { createObjectFactory } from '@/modules/core/services/objects/management'
import { ensureError } from '@speckle/shared'
import { VersionEvents } from '@/modules/core/domain/commits/events'

const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const getCommitStream = getCommitStreamFactory({ db })
const getStream = getStreamFactory({ db })
const createBranch = createBranchFactory({ db })
const createBranchAndNotify = createBranchAndNotifyFactory({
  createBranch,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  eventEmit: getEventBus().emit
})
const getCommit = getCommitFactory({ db })
const deleteCommitAndNotify = deleteCommitAndNotifyFactory({
  getCommit,
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  deleteCommit: deleteCommitFactory({ db }),
  publishSub: publish,
  emitEvent: getEventBus().emit
})

const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  emitEvent: getEventBus().emit,
  publishSub: publish
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const updateCommitAndNotify = updateCommitAndNotifyFactory({
  getCommit: getCommitFactory({ db }),
  getStream,
  getCommitStream,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getCommitBranch: getCommitBranchFactory({ db }),
  switchCommitBranch: switchCommitBranchFactory({ db }),
  updateCommit: updateCommitFactory({ db }),
  publishSub: publish,
  emitEvent: getEventBus().emit,
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db })
})
const getStreamCommitCount = getStreamCommitCountFactory({ db })

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
    emitEvent: getEventBus().emit
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
  emitEvent: getEventBus().emit
})
const getCommitsByUserId = legacyGetPaginatedUserCommitsPage({ db })
const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({ db })
const getCommitsTotalCountByBranchName = getBranchCommitsTotalCountByNameFactory({
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchCommitsTotalCount: getBranchCommitsTotalCountFactory({ db })
})
const getCommitsByBranchName = getPaginatedBranchCommitsItemsByNameFactory({
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({ db })
})
const createObject = createObjectFactory({
  storeSingleObjectIfNotFoundFactory: storeSingleObjectIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

describe('Commits @core-commits', () => {
  const user = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie4342@gmail.com',
    password: 'sn3aky-1337-b1m',
    id: ''
  }

  const stream = {
    name: 'Test Stream References',
    description: 'Whatever goes in here usually...',
    id: ''
  }

  const testObject = {
    foo: 'bar',
    baz: 'qux'
  }

  const testObject2 = {
    foo: 'bar3',
    baz: 'qux3'
  }

  const testObject3 = {
    foo: 'bar4',
    baz: 'qux5'
  }

  let quitters: (() => void)[] = []

  const generateObject = async (streamId = stream.id, object = testObject) =>
    await createObject({ streamId, object })
  const generateStream = async (streamBase = stream, ownerId = user.id) =>
    await createStream({ ...streamBase, ownerId })

  let commitId1: string, commitId2: string, commitId3: string

  before(async () => {
    await beforeEachContext()

    user.id = await createUser(user)
    stream.id = await createStream({ ...stream, ownerId: user.id })

    const testObjectId = await createObject({ streamId: stream.id, object: testObject })
    const testObject2Id = await createObject({
      streamId: stream.id,
      object: testObject2
    })
    const testObject3Id = await createObject({
      streamId: stream.id,
      object: testObject3
    })

    commitId1 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'first commit',
        sourceApplication: 'tests',
        objectId: testObjectId,
        authorId: user.id
      })
    ).id

    commitId2 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'second commit',
        sourceApplication: 'tests',
        objectId: testObject2Id,
        authorId: user.id,
        parents: [commitId1]
      })
    ).id

    commitId3 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'third commit',
        sourceApplication: 'tests',
        objectId: testObject3Id,
        authorId: user.id,
        parents: [commitId1, commitId2]
      })
    ).id
  })

  afterEach(() => {
    quitters.forEach((quit) => quit())
    quitters = []
  })

  it('Should create a commit by branch name', async () => {
    const msg = 'first commit ive ever done, yes sir'

    let eventFired = false
    quitters.push(
      getEventBus().listen(VersionEvents.Created, ({ payload }) => {
        expect(payload.version.message).to.equal(msg)
        eventFired = true
      })
    )

    const objectId = await generateObject()
    const id = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: msg,
        sourceApplication: 'tests',
        objectId,
        authorId: user.id
      })
    ).id
    expect(id).to.be.a.string
    expect(eventFired).to.be.true
  })

  // support SKDs not being able to handle the fe1 - fe2 link transition
  it('Should create a commit by branch id', async () => {
    const objectId = await generateObject()
    const branch = await createBranchAndNotify(
      { name: 'foobar', projectId: stream.id },
      user.id
    )
    const id = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: branch.id,
        message: 'first commit',
        sourceApplication: 'tests',
        objectId,
        authorId: user.id
      })
    ).id
    expect(id).to.be.a.string
  })

  it('Should fail to create a commit if the branch is not a valid name or id', async () => {
    const objectId = await generateObject()
    try {
      const id = (
        await createCommitByBranchName({
          streamId: stream.id,
          branchName: cryptoRandomString({ length: 10 }),
          message: 'first commit',
          sourceApplication: 'tests',
          objectId,
          authorId: user.id
        })
      ).id
      expect(id).null
    } catch (error) {
      expect(ensureError(error).message).contains(
        'Failed to find branch with name or id'
      )
    }
  })

  it('Should create a commit with a previous commit id', async () => {
    const objectId = await generateObject()
    const objectId2 = await generateObject()

    const id = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'second commit',
        sourceApplication: 'tests',
        objectId,
        authorId: user.id,
        parents: [commitId1]
      })
    ).id
    expect(id).to.be.a.string

    const id2 = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'third commit',
        sourceApplication: 'tests',
        objectId: objectId2,
        authorId: user.id,
        parents: [commitId1, commitId2]
      })
    ).id

    expect(id2).to.be.a.string
  })

  it('Should update a commit', async () => {
    const res = await updateCommitAndNotify(
      {
        id: commitId1,
        message: 'FIRST COMMIT YOOOOOO',
        streamId: stream.id
      },
      user.id
    )
    expect(res).to.be.ok
  })

  it('Should delete a commit', async () => {
    const objectId = await generateObject()
    const tempCommitId = (
      await createCommitByBranchName({
        streamId: stream.id,
        branchName: 'main',
        message: 'temp commit',
        sourceApplication: 'tests',
        objectId,
        authorId: user.id
      })
    ).id

    const res = await deleteCommitAndNotify(tempCommitId, stream.id, user.id)
    expect(res).to.be.ok
  })

  it('Should get a commit by id', async () => {
    const cm = await getCommit(commitId1, { streamId: stream.id })
    expect(cm!.message).to.equal('FIRST COMMIT YOOOOOO')
    expect(cm!.author).to.equal(user.id)
  })

  it('Should get the commits and their total count from a branch', async () => {
    const streamId = await generateStream()

    for (let i = 0; i < 10; i++) {
      const t = { qux: i, id: '' }
      t.id = await createObject({ streamId, object: t })
      await createCommitByBranchName({
        streamId,
        branchName: 'main',
        message: `commit # ${i + 3}`,
        sourceApplication: 'tests',
        objectId: t.id,
        authorId: user.id
      })
    }

    const { commits, cursor } = await getCommitsByBranchName({
      streamId,
      branchName: 'main',
      limit: 2
    })
    expect(commits).to.be.an('array')
    expect(commits.length).to.equal(2)

    const { commits: commits2 } = await getCommitsByBranchName({
      streamId,
      branchName: 'main',
      limit: 5,
      cursor
    })
    expect(commits2.length).to.equal(5)

    const c = await getCommitsTotalCountByBranchName({
      streamId,
      branchName: 'main'
    })
    expect(c).to.equal(10)
  })

  it('Should get the commits and their total count from a stream', async () => {
    const streamId = await generateStream()
    await createBranch({
      name: 'dim/dev',
      streamId,
      authorId: user.id,
      description: null
    })

    for (let i = 0; i < 15; i++) {
      const t = { thud: i, id: '' }
      t.id = await createObject({ streamId, object: t })
      await createCommitByBranchName({
        streamId,
        branchName: 'dim/dev',
        message: `pushed something # ${i + 3}`,
        sourceApplication: 'tests',
        objectId: t.id,
        authorId: user.id
      })
    }

    const { commits, cursor } = await getCommitsByStreamId({
      streamId,
      limit: 10
    })
    const { commits: commits2 } = await getCommitsByStreamId({
      streamId,
      limit: 20,
      cursor
    })

    expect(commits.length).to.equal(10)
    expect(commits2.length).to.equal(5)

    const c = await getStreamCommitCount(streamId)
    expect(c).to.equal(15)
  })

  it('Commits should have source, total count, branch name and parents fields', async () => {
    const { commits: userCommits } = await getCommitsByUserId({
      userId: user.id,
      limit: 1000
    })
    const userCommit = userCommits[0]

    const { commits: streamCommits } = await getCommitsByStreamId({
      streamId: stream.id,
      limit: 10
    })
    const serverCommit = streamCommits[0]

    const { commits: branchCommits } = await getCommitsByBranchName({
      streamId: stream.id,
      branchName: 'main',
      limit: 2
    })
    const branchCommit = branchCommits[0]

    const idCommit = await getCommit(commitId3, { streamId: stream.id })

    expect(userCommit).to.have.property('sourceApplication')
    expect(userCommit.sourceApplication).to.be.a('string')

    expect(userCommit).to.have.property('totalChildrenCount')
    expect(userCommit.totalChildrenCount).to.be.a('number')

    expect(userCommit).to.have.property('parents')

    for (const commit of [serverCommit, branchCommit, idCommit]) {
      expect(commit).to.have.property('sourceApplication')
      expect(commit!.sourceApplication).to.be.a('string')

      expect(commit).to.have.property('totalChildrenCount')
      expect(commit!.totalChildrenCount).to.be.a('number')

      expect(commit).to.have.property('parents')
      expect(commit!.streamId).to.equal(stream.id)
    }

    expect(idCommit!.parents).to.be.a('array')
    expect(idCommit!.parents!.length).to.equal(2)
    expect(idCommit!.streamId).to.equal(stream.id)
  })

  it('Should have an array of parents', async () => {
    const commits = [
      await getCommit(commitId3, { streamId: stream.id }),
      await getCommit(commitId2, { streamId: stream.id })
    ]

    for (const commit of commits) {
      expect(commit).to.have.property('parents')
      expect(commit!.parents).to.be.a('array')
      expect(commit!.parents!.length).to.greaterThan(0)
    }
  })
})
