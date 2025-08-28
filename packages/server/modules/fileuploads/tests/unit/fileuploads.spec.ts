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
import { type BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  type BasicTestStream,
  createTestStream
} from '@/test/speckle-helpers/streamHelper'
import {
  type BasicTestBranch,
  createTestBranch
} from '@/test/speckle-helpers/branchHelper'

const { garbageCollector } = initUploadTestEnvironment()

describe('FileUploads @fileuploads', () => {
  let userOne: BasicTestUser
  let createdStream: BasicTestStream
  let createdBranch: BasicTestBranch

  const token = cryptoRandomString({ length: 40 })
  const serverOrigin = `https://${cryptoRandomString({ length: 10 })}`

  before(async () => {
    userOne = await createTestUser({
      name: cryptoRandomString({ length: 10 }),
      email: `${cryptoRandomString({ length: 10 })}@example.org`,
      password: cryptoRandomString({ length: 10 })
    })
  })

  beforeEach(async () => {
    createdStream = await createTestStream(
      { name: cryptoRandomString({ length: 10 }), ownerId: userOne.id, id: '' },
      userOne
    )
    createdBranch = await createTestBranch({
      branch: {
        id: '',
        name: cryptoRandomString({ length: 10 }),
        streamId: createdStream.id,
        authorId: userOne.id
      },
      owner: userOne,
      stream: createdStream
    })
  })
  afterEach(async () => {
    createdStream.id = ''
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
        projectId: createdStream.id,
        modelName: 'main',
        userId: userOne.id,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: createdBranch.id
      })
      await updateFileStatus({
        fileId,
        projectId: createdStream.id,
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
        projectId: createdStream.id,
        modelName: 'main',
        userId: userOne.id,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: createdBranch.id
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
        projectId: createdStream.id,
        modelName: 'main',
        userId: userOne.id,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain',
        modelId: createdBranch.id
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
        userId: userOne.id,
        projectId: createdStream.id,
        fileSize: 100,
        fileType: 'text/plain'
      })
    })
  })
  describe('how file upload pushes a message to file-import service', () => {
    const upload = buildFileUploadMessage()

    beforeEach(async () => {
      createdBranch = await createTestBranch({
        branch: {
          name: cryptoRandomString({ length: 10 }),
          description: cryptoRandomString({ length: 10 }),
          streamId: createdStream.id,
          authorId: userOne.id,
          id: ''
        },
        stream: createdStream,
        owner: userOne
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
        projectId: createdStream.id,
        userId: userOne.id,
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
        userId: userOne.id,
        projectId: createdStream.id,
        fileSize: 100,
        fileType: 'txt'
      })
    })
  })
})
