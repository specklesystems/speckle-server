import { expect } from 'chai'
import { garbageCollectAttemptedFileImportBackgroundJobsFactory } from '@/modules/fileuploads/services/tasks'
import {
  BackgroundJobs,
  failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory,
  getBackgroundJobFactory,
  storeBackgroundJobFactory
} from '@/modules/backgroundjobs/repositories/repositories'
import { db } from '@/db/knex'
import { notifyChangeInFileStatus } from '@/modules/fileuploads/services/management'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  failPendingUploadedFilesFactory,
  getFileInfoFactoryV2,
  saveUploadFileFactoryV2
} from '@/modules/fileuploads/repositories/fileUploads'
import { testLogger } from '@/observability/logging'
import {
  type BackgroundJobPayload,
  BackgroundJobStatus,
  type BackgroundJob
} from '@/modules/backgroundjobs/domain/domain'
import type { FileImportJobPayloadV1 } from '@speckle/shared/workers/fileimport'
import cryptoRandomString from 'crypto-random-string'
import type { FileUploadRecordV2 } from '@/modules/fileuploads/helpers/types'
import {
  type BasicTestStream,
  createTestStream
} from '@/test/speckle-helpers/streamHelper'
import { type BasicTestUser, createTestUser } from '@/test/authHelper'
import type { BasicTestBranch } from '@/test/speckle-helpers/branchHelper'
import { createTestBranch } from '@/test/speckle-helpers/branchHelper'
import { FileUploadConvertedStatus } from '@speckle/shared/blobs'

const originServerUrl = 'https://example.org'

export type TestJobPayload = BackgroundJobPayload & {
  jobType: 'fileImport'
  payloadVersion: 1
  blobId: string
  testData: string
}

export const createTestJob = (
  overrides: Partial<BackgroundJob<TestJobPayload>> = {}
): BackgroundJob<TestJobPayload> => ({
  id: cryptoRandomString({ length: 10 }),
  jobType: 'fileImport',
  payload: {
    jobType: 'fileImport',
    payloadVersion: 1,
    blobId: cryptoRandomString({ length: 10 }),
    testData: 'test-data-value'
  },
  status: BackgroundJobStatus.Queued,
  attempt: 0,
  maxAttempt: 3,
  remainingComputeBudgetSeconds: 300,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

const createTestJobPayload = (overrides: Partial<TestJobPayload>): TestJobPayload => ({
  jobType: 'fileImport',
  payloadVersion: 1,
  blobId: cryptoRandomString({ length: 10 }),
  testData: cryptoRandomString({ length: 100 }),
  ...overrides
})

const createTestFileUpload = (
  overrides: Partial<
    Pick<
      FileUploadRecordV2,
      'projectId' | 'userId' | 'fileName' | 'fileType' | 'fileSize'
    > & { fileId: string; modelId: string; modelName: string }
  >
) => {
  return {
    projectId: cryptoRandomString({ length: 10 }),
    userId: cryptoRandomString({ length: 10 }),
    fileName: cryptoRandomString({ length: 10 }),
    fileType: cryptoRandomString({ length: 10 }),
    fileSize: Math.floor(Math.random() * 10_000),
    fileId: cryptoRandomString({ length: 10 }),
    modelId: cryptoRandomString({ length: 10 }),
    modelName: cryptoRandomString({ length: 10 }),
    ...overrides
  }
}

type StoredBackgroundJob = BackgroundJob<FileImportJobPayloadV1> & {
  originServerUrl: string
}

describe('File import garbage collection @fileuploads integration', () => {
  const storeBackgroundJob = storeBackgroundJobFactory({
    db,
    originServerUrl
  })
  const getBackgroundJob = getBackgroundJobFactory({ db })
  const saveUploadFile = saveUploadFileFactoryV2({ db })
  const getUploadFile = getFileInfoFactoryV2({ db })

  let userOne: BasicTestUser
  let projectOne: BasicTestStream
  let modelOne: BasicTestBranch

  before(async () => {
    userOne = await createTestUser({
      id: '',
      email: cryptoRandomString({ length: 10 }) + '@example.org',
      name: cryptoRandomString({ length: 10 })
    })
    projectOne = await createTestStream(
      {
        id: '',
        name: cryptoRandomString({ length: 10 }),
        ownerId: userOne.id
      },
      userOne
    )
    modelOne = await createTestBranch({
      branch: {
        id: '',
        name: cryptoRandomString({ length: 10 }),
        authorId: userOne.id,
        streamId: projectOne.id
      },
      stream: projectOne,
      owner: userOne
    })
  })

  beforeEach(async () => {
    // Clean up background jobs table
    await db(BackgroundJobs.name).del()
  })

  describe('garbage collect file import background jobs', () => {
    const SUT = garbageCollectAttemptedFileImportBackgroundJobsFactory({
      failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudget:
        failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory(
          {
            db
          }
        ),
      failPendingUploadedFiles: failPendingUploadedFilesFactory({
        db
      }),
      notifyUploadStatus: notifyChangeInFileStatus({
        eventEmit: getEventBus().emit
      })
    })

    it('should garbage collect failed background jobs', async () => {
      const identifiableData = cryptoRandomString({ length: 10 })

      const fileOne = createTestFileUpload({
        projectId: projectOne.id,
        modelId: modelOne.id
      })
      const processingJobAtMaxAttempts = createTestJob({
        status: BackgroundJobStatus.Processing,
        payload: createTestJobPayload({
          testData: identifiableData,
          blobId: fileOne.fileId
        }),
        attempt: 3,
        maxAttempt: 3
      })

      const fileTwo = createTestFileUpload({
        projectId: projectOne.id,
        modelId: modelOne.id
      })
      const queuedJobAtMaxAttempts = createTestJob({
        status: BackgroundJobStatus.Queued,
        payload: createTestJobPayload({
          testData: identifiableData,
          blobId: fileTwo.fileId
        }),
        attempt: 3,
        maxAttempt: 3
      })
      await saveUploadFile(fileOne)
      await storeBackgroundJob({ job: processingJobAtMaxAttempts })
      await saveUploadFile(fileTwo)
      await storeBackgroundJob({ job: queuedJobAtMaxAttempts })

      // ensure jobs are in the database and retrievable
      const existing = await db(BackgroundJobs.name)
        .whereJsonSupersetOf(BackgroundJobs.withoutTablePrefix.col.payload, {
          testData: identifiableData
        })
        .select<StoredBackgroundJob[]>('*')
      expect(existing).to.have.length(2)
      expect(
        existing.filter((j) => j.status === BackgroundJobStatus.Queued),
        JSON.stringify(existing)
      ).to.have.length(1)
      expect(
        existing.filter((j) => j.status === BackgroundJobStatus.Processing),
        JSON.stringify(existing)
      ).to.have.length(1)

      await SUT({ logger: testLogger, originServerUrl })

      // processing job should not have been garbage collected
      const resultOne = await getBackgroundJob({ jobId: processingJobAtMaxAttempts.id })
      expect(resultOne?.status).to.equal(BackgroundJobStatus.Processing)

      // queued job should have been garbage collected
      const resultTwo = await getBackgroundJob({ jobId: queuedJobAtMaxAttempts.id })
      expect(resultTwo?.status).to.equal(BackgroundJobStatus.Failed)

      const fileOneResult = await getUploadFile({ fileId: fileOne.fileId })
      const fileTwoResult = await getUploadFile({ fileId: fileTwo.fileId })

      expect(fileOneResult?.convertedStatus).to.equal(FileUploadConvertedStatus.Queued)
      expect(fileTwoResult?.convertedStatus).to.equal(FileUploadConvertedStatus.Error)
    })
  })
})
