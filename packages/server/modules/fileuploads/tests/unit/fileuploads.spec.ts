import cryptoRandomString from 'crypto-random-string'
import { db } from '@/db/knex'
import {
  getFileInfoFactory,
  saveUploadFileFactory,
  updateFileStatusFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { testLogger as logger } from '@/observability/logging'
import { sleep } from '@/test/helpers'
import { expect } from 'chai'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { TIME } from '@speckle/shared'
import { initUploadTestEnvironment } from '@/modules/fileuploads/tests/helpers/init'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import { assign, get } from 'lodash-es'
import { buildFileUploadMessage } from '@/modules/fileuploads/tests/helpers/creation'
import type { JobPayload } from '@speckle/shared/workers/fileimport'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { FileuploadEvents } from '@/modules/fileuploads/domain/events'
import type { BranchRecord } from '@/modules/core/helpers/types'

const { createStream, createBranch, createUser, garbageCollector } =
  initUploadTestEnvironment()

describe('FileUploads @fileuploads', () => {
  const userOne = {
    name: cryptoRandomString({ length: 10 }),
    email: `${cryptoRandomString({ length: 10 })}@example.org`,
    password: cryptoRandomString({ length: 10 })
  }

  let userOneId: string
  let createdStreamId: string
  let createdBranch: BranchRecord

  const token = cryptoRandomString({ length: 40 })
  const serverOrigin = `https://${cryptoRandomString({ length: 10 })}`

  before(async () => {
    userOneId = await createUser(userOne)
  })

  beforeEach(async () => {
    createdStreamId = await createStream({ ownerId: userOneId })
  })
  afterEach(async () => {
    createdStreamId = ''
  })

  describe('Convert files', () => {
    it('Should garbage collect expired files', async () => {
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        findQueue: () => ({
          scheduleJob: async () => {},
          supportedFileTypes: ['txt']
        }),
        pushJobToFileImporter: pushJobToFileImporterFactory({
          getServerOrigin: () => serverOrigin,
          createAppToken: async () => token
        }),
        saveUploadFile: saveUploadFileFactory({ db }),
        emit: async () => {}
      })
      const updateFileStatus = updateFileStatusFactory({ db })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        projectId: createdStreamId,
        modelName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: cryptoRandomString({ length: 10 })
      })
      await updateFileStatus({
        fileId,
        projectId: createdStreamId,
        status: FileUploadConvertedStatus.Converting,
        convertedMessage: 'Converting started',
        convertedCommitId: null
      })
      await sleep(2000)
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 })
      const results = await getFileInfoFactory({ db })({
        fileId
      })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Error)
    })

    it('Should not garbage collect files that are not expired', async () => {
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        findQueue: () => ({
          scheduleJob: async () => {},
          supportedFileTypes: ['txt']
        }),
        pushJobToFileImporter: pushJobToFileImporterFactory({
          getServerOrigin: () => serverOrigin,
          createAppToken: async () => token
        }),
        saveUploadFile: saveUploadFileFactory({ db }),
        emit: async () => {}
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        projectId: createdStreamId,
        modelName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: cryptoRandomString({ length: 10 })
      })
      // timeout far in the future, so it won't be garbage collected
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 * TIME.hour })
      const results = await getFileInfoFactory({ db })({
        fileId
      })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Queued)
    })

    it('sends a Started event with the file information', async () => {
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emit: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        findQueue: () => ({
          scheduleJob: async () => {},
          supportedFileTypes: ['txt']
        }),
        pushJobToFileImporter: pushJobToFileImporterFactory({
          getServerOrigin: () => serverOrigin,
          createAppToken: async () => token
        }),
        saveUploadFile: saveUploadFileFactory({ db }),
        emit
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        projectId: createdStreamId,
        modelName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: cryptoRandomString({ length: 10 })
      })

      const results = await getFileInfoFactory({ db })({
        fileId
      })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Queued)
      expect(emittedEventName).to.be.equal(FileuploadEvents.Started)
      expect(get(emittedEventPayload, 'upload')).to.be.deep.include({
        userId: userOneId,
        projectId: createdStreamId,
        fileSize: 100,
        fileType: 'text/plain'
      })
    })
  })
  describe('how file upload pushes a message to file-import service', () => {
    const upload = buildFileUploadMessage()

    beforeEach(async () => {
      createdBranch = await createBranch({
        name: cryptoRandomString({ length: 10 }),
        description: cryptoRandomString({ length: 10 }),
        streamId: createdStreamId,
        authorId: userOneId
      })
    })

    it('uses a fn that given the necessary ids, tokens and url pushes a message to the queue', async () => {
      let usedUserId = undefined
      const result = {}

      const pushJobToFileImporter = pushJobToFileImporterFactory({
        getServerOrigin: () => serverOrigin,

        createAppToken: async (args) => {
          usedUserId = args.userId
          return token
        }
      })

      await pushJobToFileImporter({
        scheduleJob: async (jobData) => {
          assign(result, jobData)
        },
        ...upload
      })

      expect(usedUserId).to.equal(upload.userId)
      const expected: JobPayload = {
        jobId: upload.jobId,
        fileName: upload.fileName,
        token,
        serverUrl: serverOrigin,
        modelId: upload.modelId,
        fileType: upload.fileType,
        projectId: upload.projectId,
        timeOutSeconds: 1800,
        blobId: upload.blobId
      }
      expect(result).to.deep.equal(expected)
    })

    it('sends a Started event with the file information', async () => {
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emit: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        findQueue: () => ({
          scheduleJob: async () => {},
          supportedFileTypes: ['txt']
        }),
        pushJobToFileImporter: pushJobToFileImporterFactory({
          getServerOrigin: () => serverOrigin,
          createAppToken: async () => token
        }),
        saveUploadFile: saveUploadFileFactory({ db }),
        emit
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        projectId: createdStreamId,
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'txt',
        modelId: createdBranch.id,
        modelName: createdBranch.name
      })

      const results = await getFileInfoFactory({ db })({
        fileId
      })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Queued)
      expect(emittedEventName).to.be.equal(FileuploadEvents.Started)
      expect(get(emittedEventPayload, 'upload')).to.be.deep.include({
        userId: userOneId,
        projectId: createdStreamId,
        fileSize: 100,
        fileType: 'txt'
      })
    })
  })
})
