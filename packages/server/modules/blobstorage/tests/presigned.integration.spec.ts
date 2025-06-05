import {
  generatePresignedUrlFactory,
  registerCompletedUploadFactory
} from '@/modules/blobstorage/services/presigned'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  getBlobMetadataFromStorage,
  getSignedUrlFactory,
  ObjectStorage
} from '@/modules/blobstorage/clients/objectStorage'
import {
  getBlobMetadataFactory,
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { Roles, TIME } from '@speckle/shared'
import { createProject } from '@/test/projectHelper'
import { createTestUser } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import { Knex } from 'knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { testLogger } from '@/observability/logging'
import { put } from 'axios'
import { expectToThrow } from '@/test/assertionHelper'
import { StoredBlobAccessError } from '@/modules/blobstorage/errors'
import { UserInputError } from '@/modules/core/errors/userinput'

describe('Presigned integration @blobstorage', async () => {
  const serverAdmin = { id: '', name: 'server admin', role: Roles.Server.Admin }
  const ownedProject = {
    id: '',
    name: 'owned stream',
    isPublic: false
  }

  let projectDb: Knex
  let projectStorage: ObjectStorage
  let getBlobMetadata: ReturnType<typeof getBlobMetadataFactory>

  before(async () => {
    await beforeEachContext()
    serverAdmin.id = (await createTestUser(serverAdmin)).id
    ownedProject.id = (
      await createProject({
        ...ownedProject,
        ownerId: serverAdmin.id
      })
    ).id
    ;[projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId: ownedProject.id }),
      getProjectObjectStorage({ projectId: ownedProject.id })
    ])
    getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
  })

  describe('generate a presigned URL', () => {
    let SUT: ReturnType<typeof generatePresignedUrlFactory>
    before(() => {
      SUT = generatePresignedUrlFactory({
        getSignedUrl: getSignedUrlFactory({
          objectStorage: projectStorage
        }),
        upsertBlob: upsertBlobFactory({
          db: projectDb
        })
      })
    })

    it('should provision a blob with uploadStatus 0 and return a presigned URL', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 20
      const url = await SUT({
        blobId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      expect(url).to.contain(`/assets/${ownedProject.id}/${blobId}?`)
      expect(url).to.contain(`X-Amz-Expires=${expiryDuration}`)
      expect(url).to.contain('X-Amz-Credential') // we don't need to check the whole url, we can trust S3; only that it appears to be signed

      const storedBlob = await getBlobMetadata({ blobId, streamId: ownedProject.id })
      expect(storedBlob).to.exist
      expect(storedBlob.id).to.equal(blobId)
      expect(storedBlob.uploadStatus).to.equal(0)
      expect(storedBlob.fileName).to.equal(fileName)
      expect(storedBlob.streamId).to.equal(ownedProject.id)
      expect(storedBlob.fileType).to.equal('stl')
    })
  })

  describe('register completed upload', () => {
    let generatePresignedUrl: ReturnType<typeof generatePresignedUrlFactory>
    let SUT: ReturnType<typeof registerCompletedUploadFactory>
    before(() => {
      generatePresignedUrl = generatePresignedUrlFactory({
        getSignedUrl: getSignedUrlFactory({
          objectStorage: projectStorage
        }),
        upsertBlob: upsertBlobFactory({
          db: projectDb
        })
      })
      SUT = registerCompletedUploadFactory({
        getBlobMetadata: getBlobMetadataFromStorage({ objectStorage: projectStorage }),
        updateBlob: updateBlobFactory({ db: projectDb }),
        logger: testLogger
      })
    })
    it('should update the blob with uploadStatus 1 and the correct ETag', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await put(url, 'test content')
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const storedBlob = await SUT({
        blobId,
        projectId: ownedProject.id,
        expectedETag,
        maximumFileSize: 1 * 1024 * 1024 // 1 MB
      })

      expect(storedBlob).to.exist
      expect(storedBlob.uploadStatus).to.equal(1)
      expect(storedBlob.fileHash).to.equal(expectedETag)
      expect(storedBlob.fileSize).to.be.greaterThan(0)
    })
    it('should throw an StoredBlobAccessError if the blob cannot be found', async () => {
      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            blobId: cryptoRandomString({ length: 10 }),
            projectId: ownedProject.id,
            expectedETag: cryptoRandomString({ length: 32 }),
            maximumFileSize: 1 * 1024 * 1024 // 1 MB
          })
      )
      expect(thrownError).to.be.instanceOf(StoredBlobAccessError)
    })
    it('should throw an UserInputError if the blob exceeds the maximum allowed size', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await put(url, 'test content') // more than 1 byte long
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            blobId,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: 1 // 1 byte max
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
    })
  })
})
