require('../bootstrap')
const { getUserByEmail } = require('@/modules/core/services/users')
const { createPersonalAccessToken } = require('@/modules/core/services/tokens')

const { createManyObjects } = require('@/test/helpers')
const { fetch } = require('undici')
const { init } = require(`@/app`)
const request = require('supertest')
const { exit } = require('yargs')
const { logger } = require('@/logging/logging')
const { Scopes } = require('@speckle/shared')
const {
  getStreamFactory,
  createStreamFactory
} = require('@/modules/core/repositories/streams')
const { db } = require('@/db/knex')
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
const { getUsers } = require('@/modules/core/repositories/users')
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  addStreamCreatedActivityFactory
} = require('@/modules/activitystream/services/streamActivity')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')

const addStreamCreatedActivity = addStreamCreatedActivityFactory({
  saveActivity: saveActivityFactory({ db }),
  publish
})
const getStream = getStreamFactory({ db })
const createStream = legacyCreateStreamFactory({
  createStreamReturnRecord: createStreamReturnRecordFactory({
    inviteUsersToProject: inviteUsersToProjectFactory({
      createAndSendInvite: createAndSendInviteFactory({
        findUserByTarget: findUserByTargetFactory(),
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
          })
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

const main = async () => {
  const testStream = {
    name: 'Test Stream 01',
    description: 'wonderful test stream'
  }

  // const userA = {
  //   name: 'd1',
  //   email: 'd.1@speckle.systems',
  //   password: 'wowwow8charsplease'
  // }
  // userA.id = await createUser(userA)

  const userA = await getUserByEmail({
    email: 'd.1@speckle.systems'
  })
  userA.token = `Bearer ${await createPersonalAccessToken(
    userA.id,
    'test token user A',
    [
      Scopes.Streams.Read,
      Scopes.Streams.Write,
      Scopes.Users.Read,
      Scopes.Users.Email,
      Scopes.Tokens.Write,
      Scopes.Tokens.Read,
      Scopes.Profile.Read,
      Scopes.Profile.Email
    ]
  )}`

  testStream.id = await createStream({ ...testStream, ownerId: userA.id })

  const { app } = await init()

  const numObjs = 5000
  const objBatch = createManyObjects(numObjs)

  const uploadRes = await request(app)
    .post(`/objects/${testStream.id}`)
    .set('Authorization', userA.token)
    .set('Content-type', 'multipart/form-data')
    .attach('batch1', Buffer.from(JSON.stringify(objBatch), 'utf8'))

  logger.info(uploadRes.status)
  const objectIds = objBatch.map((obj) => obj.id)

  const res = await fetch(`http://127.0.0.1:3000/api/getobjects/${testStream.id}`, {
    method: 'POST',
    headers: {
      Authorization: userA.token,
      'Content-Type': 'application/json',
      Accept: 'text/plain'
    },
    body: JSON.stringify({ objects: JSON.stringify(objectIds) })
  })
  const data = await res.body.getReader().read()
  logger.info(data)
  exit(0)
}

main().then(logger.info('created')).catch(logger.error('failed'))
