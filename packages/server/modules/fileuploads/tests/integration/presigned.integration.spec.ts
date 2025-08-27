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
  getBlobFactory,
  getBlobsFactory,
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
import { registerUploadCompleteAndStartFileImportFactory } from '@/modules/fileuploads/services/presigned'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import {
  getFileInfoFactory,
  saveUploadFileFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { getEventBus } from '@/modules/shared/services/eventBus'
import type { RegisterUploadCompleteAndStartFileImport } from '@/modules/fileuploads/domain/operations'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'

describe('Presigned integration @fileuploads', async () => {
  const serverAdmin = { id: '', name: 'server admin', role: Roles.Server.Admin }
  const ownedProject = {
    id: '',
    name: 'owned stream',
    isPublic: false
  }
  const model: BasicTestBranch = {
    name: cryptoRandomString({ length: 10 }),
    id: '',
    streamId: '',
    authorId: ''
  }

  let projectDb: Knex
  let projectStorage: { private: ObjectStorage; public: ObjectStorage }

  before(async () => {
    await beforeEachContext()
    serverAdmin.id = (await createTestUser(serverAdmin)).id
    ownedProject.id = (
      await createProject({
        ...ownedProject,
        ownerId: serverAdmin.id
      })
    ).id

    await createTestBranch({
      branch: model,
      stream: {
        id: ownedProject.id,
        name: '', //ignored
        isPublic: false, //ignored
        ownerId: '' //ignored
      },
      owner: {
        name: '', //ignored
        email: '', //ignored
        id: serverAdmin.id
      }
    })
    ;[projectDb, projectStorage] = await Promise.all([
      getProjectDbClient({ projectId: ownedProject.id }),
      getProjectObjectStorage({ projectId: ownedProject.id })
    ])
  })
  describe('register completed upload and start file import', () => {
    let generatePresignedUrl: ReturnType<typeof generatePresignedUrlFactory>
    let SUT: RegisterUploadCompleteAndStartFileImport
    before(() => {
      generatePresignedUrl = generatePresignedUrlFactory({
        getSignedUrl: getSignedUrlFactory({
          objectStorage: projectStorage.public
        }),
        upsertBlob: upsertBlobFactory({
          db: projectDb
        })
      })
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        queues: [
          {
            supportedFileTypes: ['stl', 'obj', 'ifc'],
            scheduleJob: () => Promise.resolve()
          }
        ],
        pushJobToFileImporter: pushJobToFileImporterFactory({
          getServerOrigin,
          createAppToken: createAppTokenFactory({
            storeApiToken: storeApiTokenFactory({ db: projectDb }),
            storeTokenScopes: storeTokenScopesFactory({ db: projectDb }),
            storeTokenResourceAccessDefinitions:
              storeTokenResourceAccessDefinitionsFactory({
                db: projectDb
              }),
            storeUserServerAppToken: storeUserServerAppTokenFactory({
              db: projectDb
            })
          })
        }),
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
        emit: getEventBus().emit
      })

      SUT = registerUploadCompleteAndStartFileImportFactory({
        registerCompletedUpload: registerCompletedUploadFactory({
          getBlob: getBlobFactory({ db: projectDb }),
          getBlobMetadata: getBlobMetadataFromStorage({
            objectStorage: projectStorage.public
          }),
          updateBlob: updateBlobFactory({
            db: projectDb
          }),
          logger: testLogger
        }),
        insertNewUploadAndNotify,
        getFileInfo: getFileInfoFactory({ db: projectDb }),
        getModelsByIds: getBranchesByIdsFactory({ db: projectDb })
      })
    })
    it('should create a record for the uploaded file', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileSize = 10
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId: fileId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const storedFile = await SUT({
        fileId,
        modelId: model.id,
        userId: serverAdmin.id,
        projectId: ownedProject.id,
        expectedETag,
        maximumFileSize: 1 * 1024 * 1024 // 1 MB
      })

      expect(storedFile).to.exist
      expect(storedFile.fileType).to.equal('stl')
      expect(storedFile.fileSize).to.equal(fileSize)
      expect(storedFile.uploadComplete).to.be.true
    })
    it('should throw a StoredBlobAccessError if the blob cannot be found', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      await generatePresignedUrl({
        blobId: fileId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      // Do not upload any file, and skip straight to requesting the file be imported

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            fileId,
            projectId: ownedProject.id,
            modelId: model.id,
            userId: serverAdmin.id,
            expectedETag: cryptoRandomString({ length: 32 }),
            maximumFileSize: 1 * 1024 * 1024 // 1 MB
          })
      )
      expect(thrownError).to.be.instanceOf(StoredBlobAccessError)
    })
    it('should throw an UserInputError if the file exceeds the maximum allowed size', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId: fileId,
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
            fileId,
            modelId: model.id,
            userId: serverAdmin.id,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: 1 // 1 byte max
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)

      // Verify that the blob is now marked as in error state
      const blobs = await getBlobsFactory({ db: projectDb })({
        streamId: ownedProject.id,
        blobIds: [fileId]
      })
      expect(blobs).to.have.lengthOf(1)
      expect(blobs[0].uploadStatus).to.equal(BlobUploadStatus.Error)
      expect(blobs[0].uploadError).to.include('[FILE_SIZE_EXCEEDED]')
    })
    it('re-registering should be idempotent', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileSize = 10
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId: fileId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const storedFile = await SUT({
        fileId,
        modelId: model.id,
        userId: serverAdmin.id,
        projectId: ownedProject.id,
        expectedETag,
        maximumFileSize: 1 * 1024 * 1024 // 1 MB
      })

      expect(storedFile).to.exist
      expect(storedFile.fileType).to.equal('stl')
      expect(storedFile.fileSize).to.equal(fileSize)
      expect(storedFile.uploadComplete).to.be.true

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            fileId,
            modelId: model.id,
            userId: serverAdmin.id,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: 1 * 1024 * 1024 // 1 MB
          })
      )
      expect(thrownError).to.be.instanceOf(AlreadyRegisteredBlobError)
      expect(thrownError.message).to.include('Blob already registered and completed')
    })
    it('re-registering with increased maximum file size after failure results in the file being processed', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileSize = 10
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId: fileId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            fileId,
            modelId: model.id,
            userId: serverAdmin.id,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: 1 // smaller than fileSize, so expected to throw
          })
      )
      expect(thrownError).to.be.instanceOf(UserInputError)

      const secondAttempt = await expectToThrow(
        async () =>
          await SUT({
            fileId,
            modelId: model.id,
            userId: serverAdmin.id,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: fileSize + 100 // an increased size, greater than the fileSize
          })
      )

      expect(secondAttempt).to.be.instanceOf(AlreadyRegisteredBlobError)
      expect(secondAttempt.message).to.contain('[FILE_SIZE_EXCEEDED]')
    })
    it('re-registering with decreased maximum file size does not change anything', async () => {
      const fileId = cryptoRandomString({ length: 10 })
      const fileSize = 10
      const fileName = `test-file-${cryptoRandomString({ length: 10 })}.stl`
      const expiryDuration = 1 * TIME.minute
      const url = await generatePresignedUrl({
        blobId: fileId,
        fileName,
        projectId: ownedProject.id,
        userId: serverAdmin.id,
        urlExpiryDurationSeconds: expiryDuration
      })

      const response = await axios.put(url, cryptoRandomString({ length: fileSize }))
      expect(
        response.status,
        JSON.stringify({ statusText: response.statusText, body: response.data })
      ).to.equal(200)
      expect(response.headers['etag'], JSON.stringify(response.headers)).to.exist

      const expectedETag = response.headers['etag']
      const storedFile = await SUT({
        fileId,
        modelId: model.id,
        userId: serverAdmin.id,
        projectId: ownedProject.id,
        expectedETag,
        maximumFileSize: fileSize + 100
      })

      expect(storedFile).to.exist
      expect(storedFile.fileType).to.equal('stl')
      expect(storedFile.fileSize).to.equal(fileSize)
      expect(storedFile.uploadComplete).to.be.true

      const thrownError = await expectToThrow(
        async () =>
          await SUT({
            fileId,
            modelId: model.id,
            userId: serverAdmin.id,
            projectId: ownedProject.id,
            expectedETag,
            maximumFileSize: 1 // smaller than our fileSize, but it is already registered so should throw
          })
      )

      expect(thrownError).to.be.instanceOf(AlreadyRegisteredBlobError)
      expect(thrownError.message).to.include('Blob already registered and completed')
    })
  })
})
