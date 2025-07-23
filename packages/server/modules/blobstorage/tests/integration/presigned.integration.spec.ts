import {
  generatePresignedUrlFactory,
  registerCompletedUploadFactory
} from '@/modules/blobstorage/services/presigned'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type { ObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import {
  getBlobMetadataFromStorage,
  getSignedUrlFactory
} from '@/modules/blobstorage/clients/objectStorage'
import {
  getBlobMetadataFactory,
  getBlobsFactory,
  getBlobFactory,
  updateBlobFactory,
  upsertBlobFactory
} from '@/modules/blobstorage/repositories'
import { Roles, TIME } from '@speckle/shared'
import { BlobUploadStatus } from '@speckle/shared/blobs'
import { createProject } from '@/test/projectHelper'
import { createTestUser } from '@/test/authHelper'
import { beforeEachContext } from '@/test/hooks'
import type { Knex } from 'knex'
import cryptoRandomString from 'crypto-random-string'
import { expect } from 'chai'
import { testLogger } from '@/observability/logging'
import axios from 'axios'
import { expectToThrow } from '@/test/assertionHelper'
import {
  AlreadyRegisteredBlobError,
  StoredBlobAccessError
} from '@/modules/blobstorage/errors'
import { UserInputError } from '@/modules/core/errors/userinput'
import type {
  GeneratePresignedUrl,
  GetBlobMetadata,
  RegisterCompletedUpload
} from '@/modules/blobstorage/domain/operations'
import { getFeatureFlags } from '@speckle/shared/environment'

const { FF_LARGE_FILE_IMPORTS_ENABLED } = getFeatureFlags()

;(FF_LARGE_FILE_IMPORTS_ENABLED ? describe : describe.skip)(
  'Presigned integration @blobstorage',
  async () => {
    const serverAdmin = { id: '', name: 'server admin', role: Roles.Server.Admin }
    const ownedProject = {
      id: '',
      name: 'owned stream',
      isPublic: false
    }

    let projectDb: Knex
    let projectStorage: { private: ObjectStorage; public: ObjectStorage }
    let getBlobMetadata: GetBlobMetadata

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
            objectStorage: projectStorage.public
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
      let generatePresignedUrl: GeneratePresignedUrl
      let SUT: RegisterCompletedUpload
      before(() => {
        generatePresignedUrl = generatePresignedUrlFactory({
          getSignedUrl: getSignedUrlFactory({
            objectStorage: projectStorage.public
          }),
          upsertBlob: upsertBlobFactory({
            db: projectDb
          })
        })
        SUT = registerCompletedUploadFactory({
          getBlob: getBlobFactory({ db: projectDb }),
          getBlobMetadata: getBlobMetadataFromStorage({
            objectStorage: projectStorage.public
          }),
          updateBlob: updateBlobFactory({
            db: projectDb
          }),
          logger: testLogger
        })
      })
      it('should update the blob with uploadStatus 1 given the correct ETag', async () => {
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

        const fileSize = 100

        const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
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
        expect(storedBlob.uploadStatus).to.equal(BlobUploadStatus.Completed)
        expect(storedBlob.fileHash).to.equal(expectedETag)
        expect(storedBlob.fileSize).to.equal(fileSize)
      })
      it('should throw an StoredBlobAccessError if the blob cannot be found', async () => {
        const blobId = cryptoRandomString({ length: 10 })
        const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
        const expiryDuration = 1 * TIME.minute
        await generatePresignedUrl({
          blobId,
          fileName,
          projectId: ownedProject.id,
          userId: serverAdmin.id,
          urlExpiryDurationSeconds: expiryDuration
        })

        // do not upload anything, skip straight to registering the 'completed' upload

        const thrownError = await expectToThrow(
          async () =>
            await SUT({
              blobId,
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

        const response = await axios.put(url, 'test content') // more than 1 byte long
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

        // Verify that the blob is now marked as in error state
        const blobs = await getBlobsFactory({ db: projectDb })({
          streamId: ownedProject.id,
          blobIds: [blobId]
        })
        expect(blobs).to.have.lengthOf(1)
        expect(blobs[0].uploadStatus).to.equal(BlobUploadStatus.Error)
        expect(blobs[0].uploadError).to.include('[FILE_SIZE_EXCEEDED]')
      })
      it('re-registering should be idempotent', async () => {
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

        const response = await axios.put(url, 'test content')
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
        expect(storedBlob.uploadStatus).to.equal(BlobUploadStatus.Completed)
        expect(storedBlob.fileHash).to.equal(expectedETag)

        const secondAttempt = await expectToThrow(
          async () =>
            await SUT({
              blobId,
              projectId: ownedProject.id,
              expectedETag,
              maximumFileSize: 1 * 1024 * 1024 // 1 MB
            })
        )

        expect(secondAttempt).to.be.instanceOf(AlreadyRegisteredBlobError)
        expect(secondAttempt.message).to.include(
          'Blob already registered and completed'
        )
      })
      it('re-registering with increased maximum file size after failure does not change anything', async () => {
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

        const response = await axios.put(url, cryptoRandomString({ length: 100 })) // more than 1 byte long
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
              maximumFileSize: 1 // our content exceeds this maximum file size
            })
        )
        expect(thrownError).to.be.instanceOf(UserInputError)

        const secondAttempt = await expectToThrow(
          async () =>
            await SUT({
              blobId,
              projectId: ownedProject.id,
              expectedETag,
              maximumFileSize: 1 * 1024 * 1024 // bigger allowed size, because maybe some environment variables changed
            })
        )

        expect(secondAttempt).to.be.instanceOf(AlreadyRegisteredBlobError)
        expect(secondAttempt.message).to.contain('[FILE_SIZE_EXCEEDED]')
      })
      it('re-registering with decreased maximum file size does not change anything', async () => {
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

        const fileSize = 100

        const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
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
          maximumFileSize: 1 * 1024 * 1024 // larger than our content
        })

        expect(storedBlob).to.exist
        expect(storedBlob.uploadStatus).to.equal(BlobUploadStatus.Completed)
        expect(storedBlob.fileHash).to.equal(expectedETag)
        expect(storedBlob.fileSize).to.equal(fileSize)

        const secondAttempt = await expectToThrow(
          async () =>
            await SUT({
              blobId,
              projectId: ownedProject.id,
              expectedETag,
              maximumFileSize: 1 // smaller than our content. But as we're already registered, we should throw an error regardless of this
            })
        )

        expect(secondAttempt).to.be.instanceOf(AlreadyRegisteredBlobError)
        expect(secondAttempt.message).to.contain(
          'Blob already registered and completed'
        )
      })
    })
  }
)
