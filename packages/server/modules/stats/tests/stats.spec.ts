/* istanbul ignore file */
import { expect } from 'chai'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { createManyObjects } from '@/test/helpers'

import {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories/index'
import { Scopes } from '@speckle/shared'
import { Server } from 'node:http'
import { db } from '@/db/knex'
import {
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory
} from '@/modules/core/services/commit/management'
import {
  createCommitFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  createBranchFactory,
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import {
  createStreamFactory,
  getStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getObjectFactory,
  storeClosuresIfNotFoundFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteServerOnlyInvitesFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  countAdminUsersFactory,
  getUserFactory,
  getUsersFactory,
  storeUserAclFactory,
  storeUserFactory
} from '@/modules/core/repositories/users'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { createUserFactory } from '@/modules/core/services/users/management'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { finalizeInvitedServerRegistrationFactory } from '@/modules/serverinvites/services/processing'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { createObjectsFactory } from '@/modules/core/services/objects/management'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  emitEvent: getEventBus().emit
})

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const getStream = getStreamFactory({ db })
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
        getUser: getUserFactory({ db }),
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
const createPersonalAccessToken = createPersonalAccessTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  }),
  storePersonalApiToken: storePersonalApiTokenFactory({ db })
})
const createObjects = createObjectsFactory({
  storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db }),
  storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db })
})

const params = { numUsers: 25, numStreams: 30, numObjects: 100, numCommits: 100 }

describe('Server stats services @stats-services', function () {
  before(async function () {
    this.timeout(15000)
    await beforeEachContext()
    await seedDb(params)
  })

  it('should return the total number of users on this server', async () => {
    const res = await getTotalUserCountFactory({ db })()
    expect(res).to.equal(params.numUsers)
  })

  it('should return the total number of streams on this server', async () => {
    const res = await getTotalStreamCountFactory({ db })()
    expect(res).to.equal(params.numStreams)
  })
})

describe('Server stats api @stats-api', function () {
  let server: Server,
    sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

  const adminUser = {
    name: 'Dimitrie',
    password: 'TestPasswordSecure',
    email: 'spam@spam.spam',
    id: '', // Will be filled in before()
    goodToken: '',
    badToken: ''
  }

  const notAdminUser = {
    name: 'Andrei',
    password: 'TestPasswordSecure',
    email: 'spasm@spam.spam',
    id: '', // Will be filled in before()
    goodToken: '',
    badToken: ''
  }

  const fullQuery = `
  query{
    serverStats{
      totalStreamCount
      totalCommitCount
      totalObjectCount
      totalUserCount
      streamHistory
      commitHistory
      objectHistory
      userHistory
      }
    }
    `

  before(async function () {
    this.timeout(15000)
    const ctx = await beforeEachContext()
    server = ctx.server
    ;({ sendRequest } = await initializeTestServer(ctx))

    adminUser.id = await createUser(adminUser)
    adminUser.goodToken = `Bearer ${await createPersonalAccessToken(
      adminUser.id,
      'test token user A',
      [Scopes.Server.Stats]
    )}`
    adminUser.badToken = `Bearer ${await createPersonalAccessToken(
      adminUser.id,
      'test token user A',
      [Scopes.Streams.Read]
    )}`

    notAdminUser.id = await createUser(notAdminUser)
    notAdminUser.goodToken = `Bearer ${await createPersonalAccessToken(
      notAdminUser.id,
      'test token user A',
      [Scopes.Server.Stats]
    )}`
    notAdminUser.badToken = `Bearer ${await createPersonalAccessToken(
      notAdminUser.id,
      'test token user A',
      [Scopes.Streams.Read]
    )}`

    await seedDb(params)
  })

  after(async function () {
    await server.close()
  })

  it('Should not get stats if user is not admin', async () => {
    const res = await sendRequest(adminUser.badToken, { query: fullQuery })
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should not get stats if user is not admin even if the token has the correct scopes', async () => {
    const res = await sendRequest(notAdminUser.goodToken, { query: fullQuery })
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should not get stats if token does not have required scope', async () => {
    const res = await sendRequest(adminUser.badToken, { query: fullQuery })
    expect(res).to.be.json
    expect(res.body.errors).to.exist
    expect(res.body.errors[0].extensions.code).to.equal('FORBIDDEN')
  })

  it('Should get server stats', async () => {
    const res = await sendRequest(adminUser.goodToken, { query: fullQuery })
    expect(res).to.be.json
    expect(res.body.errors).to.not.exist

    expect(res.body.data).to.have.property('serverStats')
    expect(res.body.data.serverStats).to.have.property('totalStreamCount')
    expect(res.body.data.serverStats).to.have.property('totalCommitCount')
    expect(res.body.data.serverStats).to.have.property('totalObjectCount')
    expect(res.body.data.serverStats).to.have.property('totalUserCount')
    expect(res.body.data.serverStats).to.have.property('streamHistory')
    expect(res.body.data.serverStats).to.have.property('commitHistory')
    expect(res.body.data.serverStats).to.have.property('userHistory')

    expect(res.body.data.serverStats.totalStreamCount).to.equal(0) // the endpoint is deprecated and we're now returning 0
    expect(res.body.data.serverStats.totalCommitCount).to.equal(0) // the endpoint is deprecated and we're now returning 0
    expect(res.body.data.serverStats.totalObjectCount).to.equal(0) // the endpoint is deprecated and we're now returning 0
    expect(res.body.data.serverStats.totalUserCount).to.equal(0) // the endpoint is deprecated and we're now returning 0

    expect(res.body.data.serverStats.streamHistory).to.be.an('array')
    expect(res.body.data.serverStats.commitHistory).to.be.an('array')
    expect(res.body.data.serverStats.userHistory).to.be.an('array')
  })
})

async function seedDb({
  numUsers = 10,
  numStreams = 10,
  numObjects = 10,
  numCommits = 10
} = {}) {
  // create users
  const userPromises = []
  for (let i = 0; i < numUsers; i++) {
    const promise = createUser({
      name: `User ${i}`,
      password: `SuperSecure${i}${i * 3.14}`,
      email: `user${i}@speckle.systems`
    })
    userPromises.push(promise)
  }

  const userIds = await Promise.all(userPromises)

  // create streams
  const streamPromises: Array<Promise<{ id: string; ownerId: string }>> = []
  for (let i = 0; i < numStreams; i++) {
    const ownerId = userIds[i >= userIds.length ? userIds.length - 1 : i]
    const promise = createStream({
      name: `Stream ${i}`,
      ownerId
    }).then((id) => ({
      id,
      ownerId
    }))

    streamPromises.push(promise)
  }

  const streamData = await Promise.all(streamPromises)

  // create a objects
  const objs = await createObjects({
    streamId: streamData[0].id,
    objects: createManyObjects(numObjects - 1)
  })

  // create commits referencing those objects
  const commitPromises = []
  for (let i = 0; i < numCommits; i++) {
    const promise = createCommitByBranchName({
      streamId: streamData[0].id,
      authorId: streamData[0].ownerId,
      branchName: 'main',
      sourceApplication: 'tests',
      objectId: objs[i >= objs.length ? objs.length - 1 : i],
      message: null,
      totalChildrenCount: undefined,
      parents: null
    })
    commitPromises.push(promise)
  }

  await Promise.all(commitPromises)
}
