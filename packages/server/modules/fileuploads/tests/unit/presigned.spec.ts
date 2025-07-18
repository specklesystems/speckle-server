import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { registerUploadCompleteAndStartFileImportFactory } from '@/modules/fileuploads/services/presigned'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { ModelNotFoundError } from '@/modules/core/errors/model'
import { BlobUploadStatus } from '@speckle/shared/blobs'

describe('Presigned @blobstorage', async () => {
  describe('register a completed blob upload', () => {
    const blobId = cryptoRandomString({ length: 10 })
    const projectId = cryptoRandomString({ length: 10 })
    const modelId = cryptoRandomString({ length: 10 })
    const userId = cryptoRandomString({ length: 10 })
    const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`

    const fakeRegisterCompletedUpload = async () => ({
      // this returned data is never used
      id: blobId,
      streamId: projectId,
      fileName,
      fileType: 'stl',
      fileSize: 101,
      uploadStatus: BlobUploadStatus.Completed,
      uploadError: null,
      createdAt: new Date(),
      fileHash: cryptoRandomString({ length: 32 }),
      userId,
      objectKey: cryptoRandomString({ length: 10 })
    })
    const fakeInsertNewUploadAndNotify = async () => ({
      id: blobId,
      projectId,
      modelId,
      userId,
      fileName,
      fileType: 'stl',
      fileSize: 101,
      uploadComplete: false,
      uploadDate: new Date(),
      uploadStatus: BlobUploadStatus.Completed,
      convertedStatus: FileUploadConvertedStatus.Queued,
      convertedLastUpdate: new Date(),
      convertedMessage: null,
      convertedCommitId: null,
      metadata: null,
      performanceData: null
    })
    const fakeGetFileInfo = async () => ({
      id: blobId,
      projectId,
      modelId,
      userId,
      fileName,
      fileType: 'stl',
      fileSize: 101,
      uploadComplete: false,
      uploadDate: new Date(),
      uploadStatus: BlobUploadStatus.Completed,
      convertedStatus: FileUploadConvertedStatus.Queued,
      convertedLastUpdate: new Date(),
      convertedMessage: null,
      convertedCommitId: null,
      metadata: null,
      performanceData: null
    })
    // const fakeGetModelsByIds = async () => [
    //   {
    //     id: modelId,
    //     streamId: projectId,
    //     authorId: userId,
    //     name: cryptoRandomString({ length: 20 }),
    //     description: null,
    //     createdAt: new Date(),
    //     updatedAt: new Date()
    //   }
    // ]

    it('should error if the model cannot be found', async () => {
      const projectId = cryptoRandomString({ length: 10 })
      const fileId = cryptoRandomString({ length: 10 })
      const SUT = registerUploadCompleteAndStartFileImportFactory({
        registerCompletedUpload: fakeRegisterCompletedUpload,
        insertNewUploadAndNotify: fakeInsertNewUploadAndNotify,
        getFileInfo: fakeGetFileInfo,
        getModelsByIds: async () => [] // return an empty array to simulate no models found
      })

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            projectId,
            fileId,
            modelId,
            userId: cryptoRandomString({ length: 10 }),
            expectedETag: cryptoRandomString({ length: 32 }),
            maximumFileSize: 10_000
          })
      )
      expect(thrownError).to.be.instanceOf(ModelNotFoundError)
    })
  })
})
