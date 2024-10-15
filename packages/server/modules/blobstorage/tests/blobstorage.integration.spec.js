const { Buffer } = require('node:buffer')
const request = require('supertest')
const expect = require('chai').expect
const { beforeEachContext } = require('@/test/hooks')
const { createToken } = require('@/modules/core/services/tokens')
const { createUser } = require('@/modules/core/services/users')
const { Scopes } = require('@/modules/core/helpers/mainConstants')
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
const { createBranchFactory } = require('@/modules/core/repositories/branches')
const { ProjectsEmitter } = require('@/modules/core/events/projectsEmitter')
const {
  addStreamCreatedActivityFactory
} = require('@/modules/activitystream/services/streamActivity')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')
const { publish } = require('@/modules/shared/utils/subscriptions')
const { getUsersFactory, getUserFactory } = require('@/modules/core/repositories/users')

const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const addStreamCreatedActivity = addStreamCreatedActivityFactory({
  saveActivity: saveActivityFactory({ db }),
  publish
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
        getUser
      }),
      getUsers
    }),
    createStream: createStreamFactory({ db }),
    createBranch: createBranchFactory({ db }),
    addStreamCreatedActivity,
    projectsEventsEmitter: ProjectsEmitter.emit
  })
})

describe('Blobs integration @blobstorage', () => {
  let app
  let token
  const user = {
    name: 'Baron Von Blubba',
    email: 'barron@bubble.bobble',
    password: 'bubblesAreMyBlobs'
  }

  before(async () => {
    ;({ app } = await beforeEachContext())
    user.id = await createUser(user)
    ;({ token } = await createToken({
      userId: user.id,
      name: 'test token',
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read]
    }))
  })
  it('Uploads from multipart upload', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', require.resolve('@/readme.md'))
      .attach('blob2', require.resolve('@/package.json'))
    expect(response.status).to.equal(201)
    expect(response.body.uploadResults).to.exist
    const uploadResults = response.body.uploadResults
    expect(uploadResults).to.have.lengthOf(2)
    expect(uploadResults.map((r) => r.uploadStatus)).to.have.members([1, 1])
  })

  it('Errors for too big files, file is deleted', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', Buffer.alloc(114_857_601, 'asdf'), 'dummy.blob')
    expect(response.body.uploadResults).to.have.lengthOf(1)
    const [uploadResult] = response.body.uploadResults
    expect(uploadResult.uploadStatus).to.equal(2)
    expect(uploadResult.uploadError).to.equal('File size limit reached')
    const blob = await request(app)
      .get(`/api/stream/${streamId}/blob/${uploadResult.blobId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(blob.status).to.equal(404)
  })

  it('Gets blob metadata', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', Buffer.alloc(100, 'asdf'), 'dummy.blob')
    expect(response.status).to.equal(201)
    expect(response.body.uploadResults).to.have.lengthOf(1)
    const [uploadResult] = response.body.uploadResults

    const metadataResult = await request(app)
      .get(`/api/stream/${streamId}/blobs`)
      .set('Authorization', `Bearer ${token}`)
    expect(metadataResult.status).to.equal(200)
    expect(metadataResult.body.blobs).to.have.lengthOf(1)
    expect(metadataResult.body.blobs[0].id).to.equal(uploadResult.blobId)
  })

  it('Deletes blob and object metadata', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', Buffer.alloc(100, 'asdf'), 'dummy.blob')
    expect(response.status).to.equal(201)
    expect(response.body.uploadResults).to.have.lengthOf(1)
    const [uploadResult] = response.body.uploadResults

    const deleteResult = await request(app)
      .delete(`/api/stream/${streamId}/blob/${uploadResult.blobId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(deleteResult.status).to.equal(204)
    const blob = await request(app)
      .get(`/api/stream/${streamId}/blob/${uploadResult.blobId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(blob.status).to.equal(404)

    const metadataResult = await request(app)
      .get(`/api/stream/${streamId}/blobs`)
      .set('Authorization', `Bearer ${token}`)
    expect(metadataResult.status).to.equal(200)
    expect(metadataResult.body).to.deep.equal({ blobs: [], cursor: null })
  })

  it('Gets uploaded blob data', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', Buffer.alloc(10, 'a'), 'dummy.blob')
    expect(response.body.uploadResults).to.have.lengthOf(1)
    const [uploadResult] = response.body.uploadResults

    const blob = await request(app)
      .get(`/api/stream/${streamId}/blob/${uploadResult.blobId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(blob.status).to.equal(200)
    expect(blob.headers['content-disposition']).to.equal(
      'attachment; filename="dummy.blob"'
    )
    expect(blob.body.toString()).to.equal('a'.repeat(10))
  })

  it('Returns 400 for bad form data', async () => {
    const streamId = await createStream({ ownerId: user.id })
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-type', 'multipart/form-data; boundary=XXX')
      // sending an unfinished part
      .send('--XXX\r\nCon')

    expect(response.status).to.equal(400)
  })
})
