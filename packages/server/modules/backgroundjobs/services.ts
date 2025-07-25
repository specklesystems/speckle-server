import type {
  BackgroundJob,
  BackgroundJobConfig,
  BackgroundJobPayload,
  StoreBackgroundJob
} from '@/modules/backgroundjobs/domain'
import { BackgroundJobStatus } from '@/modules/backgroundjobs/domain'
import cryptoRandomString from 'crypto-random-string'

export const scheduleBackgroundJobFactory = <T extends BackgroundJobPayload>({
  storeBackgroundJob,
  jobConfig
}: {
  storeBackgroundJob: StoreBackgroundJob
  jobConfig: BackgroundJobConfig
}) => {
  return async ({ jobPayload }: { jobPayload: T }): Promise<BackgroundJob<T>> => {
    const jobId = cryptoRandomString({ length: 10 })
    const job = {
      ...jobConfig,
      attempt: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: jobId,
      jobType: jobPayload.jobType,
      payload: jobPayload,
      status: BackgroundJobStatus.Queued
    }
    await storeBackgroundJob({
      job
    })
    return job
  }
}
