import {
  generatePresignedUrlFactory,
  registerCompletedUploadFactory
} from '@/modules/blobstorage/services/presigned'
import { UserInputError } from '@/modules/core/errors/userinput'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { testLogger } from '@/observability/logging'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { BlobUploadStatus } from '@speckle/shared/blobs'

describe('Presigned @blobstorage', async () => {
  describe('generate a presigned URL', () => {
    it('should generate a presigned URL for uploading a blob', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: BlobUploadStatus.Pending,
          uploadError: null,
          createdAt: new Date(),
          fileHash: null
        })
      })
      const response = await SUT({
        projectId,
        userId: cryptoRandomString({ length: 10 }),
        blobId,
        fileName: `test-file-${cryptoRandomString({ length: 10 })}.stl`,
        urlExpiryDurationSeconds: 60
      })
      expect(response).to.equal(
        `https://example.com/assets/${projectId}/${blobId}?expires=60`
      )
    })
    it('should error if a file name suffix (file type) is not provided', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: BlobUploadStatus.Pending,
          uploadError: null,
          createdAt: new Date(),
          fileHash: null
        })
      })
      const thrownError = await expectToThrow(() =>
        SUT({
          projectId,
          userId: cryptoRandomString({ length: 10 }),
          blobId,
          fileName: `test-file-${cryptoRandomString({ length: 10 })}`, // no file type
          urlExpiryDurationSeconds: 60
        })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
    })
    //TODO: re-enable this test once we have a list of accepted file types including all image & video formats
    it.skip('should error if a file name suffix (file type) is not accepted', async () => {
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: BlobUploadStatus.Pending,
          uploadError: null,
          createdAt: new Date(),
          fileHash: null
        })
      })
      const thrownError = await expectToThrow(() =>
        SUT({
          projectId,
          userId: cryptoRandomString({ length: 10 }),
          blobId,
          fileName: `test-file-${cryptoRandomString({ length: 10 })}.verboten`, // unacceptable file type
          urlExpiryDurationSeconds: 60
        })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
    })
  })
  describe('register a completed blob upload', () => {
    const fakeGetBlob = async () => ({
      // this returned data is never used
      id: cryptoRandomString({ length: 10 }),
      streamId: cryptoRandomString({ length: 10 }),
      fileName: `test-file-${cryptoRandomString({ length: 10 })}.stl`,
      fileType: 'stl',
      fileSize: null,
      uploadStatus: BlobUploadStatus.Pending,
      uploadError: null,
      createdAt: new Date(),
      fileHash: null,
      userId: cryptoRandomString({ length: 10 }),
      objectKey: cryptoRandomString({ length: 10 })
    })

    const fakeUpdateBlob = async () => ({
      // this returned data is never used
      id: cryptoRandomString({ length: 10 }),
      streamId: cryptoRandomString({ length: 10 }),
      fileName: `test-file-${cryptoRandomString({ length: 10 })}.stl`,
      fileType: 'stl',
      fileSize: 101,
      uploadStatus: BlobUploadStatus.Completed,
      uploadError: null,
      createdAt: new Date(),
      fileHash: cryptoRandomString({ length: 32 }),
      userId: cryptoRandomString({ length: 10 }),
      objectKey: cryptoRandomString({ length: 10 })
    })
    it('should error if the etag is not provided', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileHash = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const SUT = registerCompletedUploadFactory({
        getBlob: fakeGetBlob,
        getBlobMetadata: async () => ({
          contentLength: 1000,
          eTag: fileHash
        }),
        updateBlob: fakeUpdateBlob,
        logger: testLogger
      })

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            blobId,
            expectedETag: '', // no etag provided
            maximumFileSize: 10_000
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
      expect(thrownError.message).to.contain('ETag is required')
    })
    it('should error if the etag does not match the uploaded blob', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileHash = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const SUT = registerCompletedUploadFactory({
        getBlob: fakeGetBlob,
        getBlobMetadata: async () => ({
          contentLength: 1000,
          eTag: fileHash // the etag to match
        }),
        updateBlob: fakeUpdateBlob,
        logger: testLogger
      })

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            blobId,
            expectedETag: cryptoRandomString({ length: 32 }), // mismatched etag
            maximumFileSize: 10_000
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
      expect(thrownError.message).to.contain('ETag mismatch')
    })
    it('should error if the content length is greater than the maximum file size', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileHash = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const maximumFileSize = 100
      const SUT = registerCompletedUploadFactory({
        getBlob: fakeGetBlob,
        getBlobMetadata: async () => ({
          contentLength: maximumFileSize + 1,
          eTag: fileHash
        }),
        updateBlob: fakeUpdateBlob,
        logger: testLogger
      })

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            blobId,
            expectedETag: fileHash,
            maximumFileSize
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
      expect(thrownError.message).to.contain('File size exceeds maximum')
    })
    it('should error if the maximum file size is not logical', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileHash = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const maximumFileSize = -22 // negative file size for this test
      const SUT = registerCompletedUploadFactory({
        getBlob: fakeGetBlob,
        getBlobMetadata: async () => ({
          contentLength: 100,
          eTag: fileHash
        }),
        updateBlob: fakeUpdateBlob,
        logger: testLogger
      })

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            blobId,
            expectedETag: fileHash,
            maximumFileSize
          })
      )
      expect(thrownError).to.be.instanceOf(MisconfiguredEnvironmentError)
      expect(thrownError.message).to.contain('Maximum file size must be greater than')
    })
    it('should throw an error if there is no existing blob with the given ID', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileHash = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const SUT = registerCompletedUploadFactory({
        getBlob: async () => undefined, // simulate no existing blob
        getBlobMetadata: async () => ({
          contentLength: 1000,
          eTag: fileHash
        }),
        updateBlob: fakeUpdateBlob,
        logger: testLogger
      })
      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            blobId,
            expectedETag: fileHash,
            maximumFileSize: 10_000
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)
      expect(thrownError.message).to.contain(
        'Please use mutation generateUploadUrl to create a blob before registering a completed upload'
      )
    })
  })
})
