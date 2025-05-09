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

const { createStream, createUser, garbageCollector } = initUploadTestEnvironment()

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
})
