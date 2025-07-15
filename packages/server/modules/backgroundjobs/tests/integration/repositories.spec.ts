import knex, { db } from '@/db/knex'
import {
  storeBackgroundJobFactory,
  getBackgroundJobFactory,
  BackgroundJobs,
  getBackgroundJobCountFactory
} from '@/modules/backgroundjobs/repositories'
import {
  BackgroundJob,
  BackgroundJobPayload,
  BackgroundJobStatus
} from '@/modules/backgroundjobs/domain'
import { expect } from 'chai'
import { createRandomString } from '@/modules/core/helpers/testHelpers'

const originServerUrl = 'http://example.org'

describe('Background Jobs repositories @backgroundjobs', () => {
  const storeBackgroundJob = storeBackgroundJobFactory({
    db,
    originServerUrl
  })
  const getBackgroundJob = getBackgroundJobFactory({ db })
  const getBackgroundJobCount = getBackgroundJobCountFactory({ db })

  type TestJobPayload = BackgroundJobPayload & {
    jobType: 'test-job' | 'test-job-2'
    payloadVersion: 1
    testData: string
  }

  const createTestJob = (
    overrides: Partial<BackgroundJob<TestJobPayload>> = {}
  ): BackgroundJob<TestJobPayload> => ({
    id: createRandomString(10),
    jobType: 'test-job',
    payload: {
      jobType: 'test-job',
      payloadVersion: 1,
      testData: 'test-data-value'
    },
    status: BackgroundJobStatus.Queued,
    attempt: 0,
    maxAttempt: 3,
    timeoutMs: 30000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  beforeEach(async () => {
    // Clean up background jobs table
    await db(BackgroundJobs.name).del()
  })

  describe('storeBackgroundJobFactory', () => {
    it('should store a background job in the database', async () => {
      const job = createTestJob({
        payload: {
          jobType: 'test-job',
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
        jobType: 'test-job',
        status: BackgroundJobStatus.Queued
      })
      const anotherQueuedJob = createTestJob({
        jobType: 'test-job-2',
        status: BackgroundJobStatus.Queued
      })
      const failedJob = createTestJob({
        jobType: 'test-job',
        status: BackgroundJobStatus.Failed
      })
      await storeBackgroundJob({ job: queuedJob })
      await storeBackgroundJob({ job: failedJob })
      await storeBackgroundJob({ job: anotherQueuedJob })

      const count = await getBackgroundJobCount({
        status: BackgroundJobStatus.Queued,
        jobType: 'test-job'
      })

      expect(count).to.equal(1)
    })

    it('is able to count locked jobs', async () => {
      const job = createTestJob({
        jobType: 'test-job',
        status: BackgroundJobStatus.Queued
      })
      await storeBackgroundJob({ job })

      const trx = await knex.transaction()
      await trx().from(BackgroundJobs.name).where({ id: job.id }).forUpdate().first() // acquire lock

      const [processingCount, queuedCount] = await Promise.all([
        getBackgroundJobCount({ status: 'processing', jobType: 'test-job' }),
        getBackgroundJobCount({ status: 'queued', jobType: 'test-job' })
      ])

      expect(processingCount).to.equal(1)
      expect(queuedCount).to.equal(0)

      await trx.commit()
    })
  })
})
