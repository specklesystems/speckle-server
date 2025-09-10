import { db } from '@/db/knex'
import {
  storeBackgroundJobFactory,
  getBackgroundJobFactory,
  BackgroundJobs,
  getBackgroundJobCountFactory,
  failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory
} from '@/modules/backgroundjobs/repositories/backgroundjobs'
import type {
  BackgroundJob,
  BackgroundJobPayload
} from '@/modules/backgroundjobs/domain/types'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain/types'
import { expect } from 'chai'
import { createRandomString } from '@/modules/core/helpers/testHelpers'

const originServerUrl = 'http://example.org'

type TestJobPayload = BackgroundJobPayload & {
  jobType: 'fileImport'
  payloadVersion: 1
  testData: string
}

const createTestJob = (
  overrides: Partial<BackgroundJob<TestJobPayload>> = {}
): BackgroundJob<TestJobPayload> => ({
  id: createRandomString(10),
  jobType: 'fileImport',
  payload: {
    jobType: 'fileImport',
    payloadVersion: 1,
    testData: 'test-data-value'
  },
  status: BackgroundJobStatus.Queued,
  attempt: 0,
  maxAttempt: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  remainingComputeBudgetSeconds: 30,
  ...overrides
})

describe('Background Jobs repositories @backgroundjobs', () => {
  const storeBackgroundJob = storeBackgroundJobFactory({
    db,
    originServerUrl
  })
  const getBackgroundJob = getBackgroundJobFactory({ db })
  const getBackgroundJobCount = getBackgroundJobCountFactory({ db })

  beforeEach(async () => {
    // Clean up background jobs table
    await db(BackgroundJobs.name).del()
  })

  describe('storeBackgroundJobFactory', () => {
    it('should store a background job in the database', async () => {
      const job = createTestJob({
        payload: {
          jobType: 'fileImport',
          payloadVersion: 1,
          testData: 'complex-test-data'
        }
      })

      await storeBackgroundJob({ job })

      const storedJob = await db(BackgroundJobs.name).where({ id: job.id }).first()

      expect(storedJob.payload).to.deep.equal(job.payload)
    })

    it('should throw error when trying to store job with duplicate ID', async () => {
      const job = createTestJob()

      await storeBackgroundJob({ job })

      try {
        await storeBackgroundJob({ job })
        expect.fail('Should have thrown an error for duplicate ID')
      } catch (error) {
        expect(error).to.be.instanceOf(Error)
        // PostgreSQL unique constraint violation
        expect((error as Error).message).to.include('duplicate key value')
      }
    })
  })

  describe('getBackgroundJobFactory', () => {
    it('should retrieve a stored background job by ID', async () => {
      const job = createTestJob()
      await storeBackgroundJob({ job })

      const retrievedJob = await getBackgroundJob({ jobId: job.id })

      expect(retrievedJob).to.not.be.null
      expect(retrievedJob).to.deep.equal({ originServerUrl, ...job })
    })

    it('should return null for non-existent job ID', async () => {
      const nonExistentId = createRandomString(10)

      const retrievedJob = await getBackgroundJob({ jobId: nonExistentId })

      expect(retrievedJob).to.be.null
    })
  })

  describe('getBackgroundJobCount', () => {
    it('counts all background jobs given a status and a jobType', async () => {
      const queuedJob = createTestJob({
        jobType: 'fileImport',
        status: BackgroundJobStatus.Queued
      })
      const anotherQueuedJob = createTestJob({
        jobType: 'fileImport-2' as unknown as 'fileImport',
        status: BackgroundJobStatus.Queued
      })
      const failedJob = createTestJob({
        jobType: 'fileImport',
        status: BackgroundJobStatus.Failed
      })
      await storeBackgroundJob({ job: queuedJob })
      await storeBackgroundJob({ job: failedJob })
      await storeBackgroundJob({ job: anotherQueuedJob })

      const count = await getBackgroundJobCount({
        status: BackgroundJobStatus.Queued,
        jobType: 'fileImport'
      })

      expect(count).to.equal(1)
    })

    it('is able to count locked jobs', async () => {
      const job = createTestJob({
        jobType: 'fileImport',
        status: BackgroundJobStatus.Processing
      })
      await storeBackgroundJob({ job })

      const [processingCount, queuedCount] = await Promise.all([
        getBackgroundJobCount({ status: 'processing', jobType: 'fileImport' }),
        getBackgroundJobCount({ status: 'queued', jobType: 'fileImport' })
      ])

      expect(processingCount).to.equal(1)
      expect(queuedCount).to.equal(0)
    })

    it('filters by min attempts', async () => {
      const pendingJob = createTestJob({
        jobType: 'fileImport',
        status: BackgroundJobStatus.Queued,
        attempt: 0
      })
      const waitingJob = createTestJob({
        jobType: 'fileImport',
        status: BackgroundJobStatus.Queued,
        attempt: 1
      })
      await storeBackgroundJob({ job: pendingJob })
      await storeBackgroundJob({ job: waitingJob })

      const count = await getBackgroundJobCount({
        status: BackgroundJobStatus.Queued,
        jobType: 'fileImport',
        minAttempts: 1
      })

      expect(count).to.equal(1)
    })
  })

  describe('failQueuedBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory', () => {
    it('should fail queued background jobs that meet or exceed maximum attempts', async () => {
      const job = createTestJob({
        status: BackgroundJobStatus.Queued,
        attempt: 2,
        maxAttempt: 2
      })
      await storeBackgroundJob({ job })

      const SUT =
        failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory({
          db
        })

      await SUT({ originServerUrl, jobType: 'fileImport' })

      const updatedJob = await db(BackgroundJobs.name).where({ id: job.id }).first()
      expect(updatedJob.status).to.equal(BackgroundJobStatus.Failed)
    })

    it('should fail queued background jobs with zero compute budget', async () => {
      const job = createTestJob({
        payload: {
          jobType: 'fileImport',
          payloadVersion: 1,
          testData: 'complex-test-data'
        },
        remainingComputeBudgetSeconds: 0
      })
      await storeBackgroundJob({ job })

      const SUT =
        failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory({
          db
        })

      await SUT({ originServerUrl, jobType: 'fileImport' })

      const updatedJob = await db(BackgroundJobs.name).where({ id: job.id }).first()
      expect(updatedJob.status).to.equal(BackgroundJobStatus.Failed)
    })
    it('should fail queued background jobs with negative compute budget', async () => {
      const job = createTestJob({
        payload: {
          jobType: 'fileImport',
          payloadVersion: 1,
          testData: 'complex-test-data'
        },
        remainingComputeBudgetSeconds: -100
      })
      await storeBackgroundJob({ job })

      const SUT =
        failBackgroundJobsWhichExceedMaximumAttemptsOrNoRemainingComputeBudgetFactory({
          db
        })

      await SUT({ originServerUrl, jobType: 'fileImport' })

      const updatedJob = await db(BackgroundJobs.name).where({ id: job.id }).first()
      expect(updatedJob.status).to.equal(BackgroundJobStatus.Failed)
    })
  })
})
