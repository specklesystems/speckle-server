import { generatePresignedUrlFactory } from '@/modules/blobstorage/services/presigned'
import { UserInputError } from '@/modules/core/errors/userinput'
import { expectToThrow } from '@/test/assertionHelper'
import { S3Client } from '@aws-sdk/client-s3'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Presigned @blobstorage', async () => {
  describe('generate a presigned URL', () => {
    it('should generate a presigned URL for uploading a blob', async () => {
      const bucket = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        objectStorage: {
          client: new S3Client({}), //TODO mock S3 client
          bucket
        },
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: 0,
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
      const bucket = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        objectStorage: {
          client: new S3Client({}),
          bucket
        },
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: 0,
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
      const bucket = cryptoRandomString({ length: 10 })
      const blobId = cryptoRandomString({ length: 10 })
      const projectId = cryptoRandomString({ length: 10 })

      const SUT = generatePresignedUrlFactory({
        objectStorage: {
          client: new S3Client({}),
          bucket
        },
        getSignedUrl: async ({ objectKey, urlExpiryDurationSeconds }) =>
          `https://example.com/${objectKey}?expires=${urlExpiryDurationSeconds}`,
        upsertBlob: async (blob) => ({
          ...blob,
          fileSize: 0,
          fileType: blob.fileType || 'unknown',
          uploadStatus: 0,
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
})
