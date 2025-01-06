import { Buffer } from 'node:buffer'
import request from 'supertest'
import { expect } from 'chai'
import { beforeEachContext, getMainTestRegionKeyIfMultiRegion } from '@/test/hooks'
import { Scopes } from '@/modules/core/helpers/mainConstants'
import { db } from '@/db/knex'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'

import {
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
import { UsersEmitter } from '@/modules/core/events/usersEmitter'
import { createTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenScopesFactory,
  storeTokenResourceAccessDefinitionsFactory
} from '@/modules/core/repositories/tokens'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { waitForRegionUser } from '@/test/speckle-helpers/regions'
import { createTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import { faker } from '@faker-js/faker'
import { BasicTestUser } from '@/test/authHelper'
import cryptoRandomString from 'crypto-random-string'
import type { BlobStorageItem } from '@/modules/blobstorage/domain/types'

const getServerInfo = getServerInfoFactory({ db })

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

const createRandomUser = async (): Promise<BasicTestUser> => {
  const userDetails = {
    name: cryptoRandomString({ length: 10 }),
    email: `${cryptoRandomString({ length: 10, type: 'url-safe' })}@example.org`,
    password: cryptoRandomString({ length: 12 })
  }
  return {
    ...userDetails,
    id: await createUser(userDetails)
  }
}
const createToken = createTokenFactory({
  storeApiToken: storeApiTokenFactory({ db }),
  storeTokenScopes: storeTokenScopesFactory({ db }),
  storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
    db
  })
})

describe('Blobs integration @blobstorage', () => {
  let app: Express.Application
  let token: string
  let user: BasicTestUser
  const workspace = {
    name: 'Anutha Blob Test Workspace #1',
    ownerId: '',
    id: '',
    slug: ''
  }

  const createStreamForTest = async (streamOwner: BasicTestUser) => {
    const stream: Partial<BasicTestStream> = {
      name: faker.company.name(),
      isPublic: false,
      workspaceId: workspace.id
    }
    await createTestStream(stream, streamOwner)
    return stream.id
  }

  before(async () => {
    ;({ app } = await beforeEachContext())
    user = await createRandomUser()
    await waitForRegionUser(user.id)
    await createTestWorkspace(workspace, user, {
      regionKey: getMainTestRegionKeyIfMultiRegion()
    })
    ;({ token } = await createToken({
      userId: user.id,
      name: 'test token',
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read]
    }))
  })
  it('Uploads from multipart upload', async () => {
    const streamId = await createStreamForTest(user)
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .attach('blob1', require.resolve('@/readme.md'))
      .attach('blob2', require.resolve('@/package.json'))
    expect(response.status).to.equal(201)
    expect(response.body.uploadResults).to.exist
    const uploadResults = response.body.uploadResults
    expect(uploadResults).to.have.lengthOf(2)
    expect(uploadResults.map((r: BlobStorageItem) => r.uploadStatus)).to.have.members([
      1, 1
    ])
  })

  it('Errors for too big files, file is deleted', async () => {
    const streamId = await createStreamForTest(user)
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
    const streamId = await createStreamForTest(user)
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
    const streamId = await createStreamForTest(user)
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
    const streamId = await createStreamForTest(user)
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
    const streamId = await createStreamForTest(user)
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-type', 'multipart/form-data; boundary=XXX')
      // sending an unfinished part
      .send('--XXX\r\nCon')

    expect(response.status).to.equal(400)
  })

  it('Returns 400 for missing content-type', async () => {
    const streamId = await createStreamForTest()
    const response = await request(app)
      .post(`/api/stream/${streamId}/blob`)
      .set('Authorization', `Bearer ${token}`)
    // .set('Content-type', 'multipart/form-data; boundary=XXX') // purposefully missing content-type header

    expect(response.status).to.equal(400)
  })
})
