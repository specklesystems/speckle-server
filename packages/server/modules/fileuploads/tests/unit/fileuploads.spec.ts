import cryptoRandomString from 'crypto-random-string'
import { db } from '@/db/knex'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import {
  getFileInfoFactory,
  saveUploadFileFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { publish } from '@/modules/shared/utils/subscriptions'
import { testLogger as logger } from '@/observability/logging'
import { sleep } from '@/test/helpers'
import { expect } from 'chai'
import { FileUploadConvertedStatus } from '@/modules/fileuploads/helpers/types'
import { TIME } from '@speckle/shared'
import { initUploadTestEnvironment } from '@/modules/fileuploads/tests/helpers/init'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import { assign } from 'lodash-es'
import { buildFileUploadMessage } from '@/modules/fileuploads/tests/helpers/creation'
import { getFeatureFlags } from '@speckle/shared/environment'

const { createStream, createUser, garbageCollector } = initUploadTestEnvironment()

const { FF_NEXT_GEN_FILE_IMPORTER_ENABLED } = getFeatureFlags()

describe('FileUploads @fileuploads', () => {
  const userOne = {
    name: cryptoRandomString({ length: 10 }),
    email: `${cryptoRandomString({ length: 10 })}@example.org`,
    password: cryptoRandomString({ length: 10 })
  }

  let userOneId: string
  let createdStreamId: string

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
        getStreamBranchByName: getStreamBranchByNameFactory({ db }),
        saveUploadFile: saveUploadFileFactory({ db }),
        publish
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        streamId: createdStreamId,
        branchName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain'
      })
      await sleep(2000)
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 })
      const results = await getFileInfoFactory({ db })({ fileId })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Error)
    })

    it('Should not garbage collect files that are not expired', async () => {
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db }),
        saveUploadFile: saveUploadFileFactory({ db }),
        publish
      })
      const fileId = cryptoRandomString({ length: 10 })
      await insertNewUploadAndNotify({
        streamId: createdStreamId,
        branchName: 'main',
        userId: userOneId,
        fileId,
        fileName: 'testfile.txt',
        fileSize: 100,
        fileType: 'text/plain'
      })
      // timeout far in the future, so it won't be garbage collected
      await garbageCollector({ logger, timeoutThresholdSeconds: 1 * TIME.hour })
      const results = await getFileInfoFactory({ db })({ fileId })
      if (!results) {
        expect(results).to.not.be.undefined
        return //HACK to appease typescript
      }
      expect(results.convertedStatus).to.be.equal(FileUploadConvertedStatus.Queued)
    })
  })
  ;(FF_NEXT_GEN_FILE_IMPORTER_ENABLED ? describe : describe.skip)(
    'how file upload pushes a message to file-import service',
    () => {
      it('uses a fn that given the necessary ids, tokens and url pushes a message to the queue', async () => {
        let usedUserId = undefined
        const result = {}
        const token = cryptoRandomString({ length: 40 })
        const serverOrigin = `https://${cryptoRandomString({ length: 10 })}`
        const upload = buildFileUploadMessage()

        const pushJobToFileImporter = pushJobToFileImporterFactory({
          getServerOrigin: () => serverOrigin,
          scheduleJob: async (jobData) => {
            assign(result, jobData)
            return Promise.resolve(cryptoRandomString({ length: 10 }))
          },
          createAppToken: (args) => {
            usedUserId = args.userId
            return Promise.resolve(token)
          }
        })

        await pushJobToFileImporter(upload)

        expect(usedUserId).to.equal(upload.userId)
        expect(result).to.deep.equal({
          type: 'file-import',
          payload: {
            token,
            url: `${serverOrigin}/projects/${upload.projectId}/fileimporter/jobs/${upload.jobId}/results`,
            modelId: upload.modelId,
            fileType: upload.fileType,
            projectId: upload.projectId,
            timeOutSeconds: 1200,
            blobId: upload.blobId
          }
        })
      })
    }
  )
})
