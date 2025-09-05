import { expect } from 'chai'
import { createBackgroundJobFactory } from '@/modules/backgroundjobs/services/create'
import type {
  BackgroundJob,
  BackgroundJobConfig,
  BackgroundJobPayload,
  StoreBackgroundJob
} from '@/modules/backgroundjobs/domain/types'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain/types'

describe('scheduleBackgroundJobFactory', () => {
  const mockJobConfig: BackgroundJobConfig = {
    maxAttempt: 3,
    remainingComputeBudgetSeconds: 30
  }

  interface TestJobPayload extends BackgroundJobPayload {
    jobType: 'fileImport'
    payloadVersion: 1
    testData: string
  }

  const mockJobPayload: TestJobPayload = {
    jobType: 'fileImport',
    payloadVersion: 1,
    testData: 'test-data-value'
  }

  let storedJob: BackgroundJob<BackgroundJobPayload> | null = null
  let storeBackgroundJobCalled = false

  const mockStoreBackgroundJob: StoreBackgroundJob = async ({ job }) => {
    storedJob = job
    storeBackgroundJobCalled = true
  }

  beforeEach(() => {
    storedJob = null
    storeBackgroundJobCalled = false
  })

  describe('when called with valid parameters', () => {
    it('should create and store a background job with correct properties', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(storeBackgroundJobCalled).to.be.true
      expect(storedJob).to.not.be.null
      expect(result).to.deep.equal(storedJob)
    })

    it('should generate a unique job ID', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(result.id).to.be.a('string')
      expect(result.id).to.have.length(10)
    })

    it('should set job status to Queued', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(result.status).to.equal(BackgroundJobStatus.Queued)
    })

    it('should set attempt to 0', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(result.attempt).to.equal(0)
    })

    it('should include job config properties', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(result.maxAttempt).to.equal(mockJobConfig.maxAttempt)
      expect(result.remainingComputeBudgetSeconds).to.equal(
        mockJobConfig.remainingComputeBudgetSeconds
      )
    })

    it('should preserve job payload', async () => {
      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      expect(result.payload).to.deep.equal(mockJobPayload)
      expect(result.jobType).to.equal(mockJobPayload.jobType)
    })

    it('should set createdAt and updatedAt timestamps', async () => {
      const beforeTest = new Date()

      const createBackgroundJob = createBackgroundJobFactory({
        storeBackgroundJob: mockStoreBackgroundJob,
        jobConfig: mockJobConfig
      })

      const result = await createBackgroundJob({ jobPayload: mockJobPayload })

      const afterTest = new Date()

      expect(result.createdAt).to.be.instanceof(Date)
      expect(result.updatedAt).to.be.instanceof(Date)
      expect(result.createdAt.getTime()).to.be.at.least(beforeTest.getTime())
      expect(result.createdAt.getTime()).to.be.at.most(afterTest.getTime())
      expect(result.updatedAt.getTime()).to.be.at.least(beforeTest.getTime())
      expect(result.updatedAt.getTime()).to.be.at.most(afterTest.getTime())
    })

    describe('when storeBackgroundJob throws an error', () => {
      it('should propagate the error', async () => {
        const errorMessage = 'Storage error'
        const failingStore: StoreBackgroundJob = async () => {
          throw new Error(errorMessage)
        }

        const createBackgroundJob = createBackgroundJobFactory({
          storeBackgroundJob: failingStore,
          jobConfig: mockJobConfig
        })

        try {
          await createBackgroundJob({ jobPayload: mockJobPayload })
          expect.fail('Should have thrown an error')
        } catch (error) {
          expect(error).to.be.instanceof(Error)
          expect((error as Error).message).to.equal(errorMessage)
        }
      })
    })
  })
})
