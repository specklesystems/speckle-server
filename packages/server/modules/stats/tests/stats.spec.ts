/* istanbul ignore file */
import { expect } from 'chai'
import { beforeEachContext, initializeTestServer } from '@/test/hooks'
import { createManyObjects } from '@/test/helpers'

import {
  getTotalStreamCountFactory,
  getTotalUserCountFactory
} from '@/modules/stats/repositories/index'
import { Scopes } from '@speckle/shared'
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
  getStreamRolesFactory,
  grantStreamPermissionsFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  getObjectFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import {
  createStreamReturnRecordFactory,
  legacyCreateStreamFactory
} from '@/modules/core/services/streams/management'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { createPersonalAccessTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storePersonalApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { createObjectsFactory } from '@/modules/core/services/objects/management'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import { storeProjectRoleFactory } from '@/modules/core/repositories/projects'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
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
const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        getStreamRoles: getStreamRolesFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
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
        getUser: getUserFactory({ db }),
        getServerInfo,
        finalizeInvite: buildFinalizeProjectInvite()
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    storeProjectRole: storeProjectRoleFactory({ db }),
    emitEvent: getEventBus().emit
  })
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
  storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({ db })
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
  let sendRequest: Awaited<ReturnType<typeof initializeTestServer>>['sendRequest']

  let adminUser: BasicTestUser & { goodToken?: string; badToken?: string }
  let notAdminUser: BasicTestUser & { goodToken?: string; badToken?: string }

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
    ;({ sendRequest } = await initializeTestServer(ctx))

    adminUser = await createTestUser({
      name: 'Dimitrie',
      password: 'TestPasswordSecure',
      email: 'spam@spam.spam',
      id: ''
    })
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

    notAdminUser = await createTestUser({
      name: 'Andrei',
      password: 'TestPasswordSecure',
      email: 'spasm@spam.spam',
      id: ''
    })
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
  const users = []
  for (let i = 0; i < numUsers; i++) {
    const user = await createTestUser({
      name: `User ${i}`,
      password: `SuperSecure${i}${i * 3.14}`,
      email: `user${i}@speckle.systems`
    })
    users.push(user)
  }

  // create streams
  const streamPromises: Array<Promise<{ id: string; ownerId: string }>> = []
  for (let i = 0; i < numStreams; i++) {
    const { id: ownerId } = users[i >= users.length ? users.length - 1 : i]
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
