import { z } from 'zod'
export const BackgroundJobStatus = {
  Queued: 'queued',
  Processing: 'processing',
  Succeeded: 'succeeded',
  Failed: 'failed'
} as const

export type BackgroundJobStatus =
  (typeof BackgroundJobStatus)[keyof typeof BackgroundJobStatus]

export const BackgroundJobPayload = z.object({
  jobType: z.string(),
  payloadVersion: z.number()
})

export type BackgroundJobPayload = z.infer<typeof BackgroundJobPayload>

export type BackgroundJobConfig = {
  maxAttempt: number
  timeoutMs: number
}

export type BackgroundJob<T extends BackgroundJobPayload> = BackgroundJobConfig & {
  id: string
  jobType: T['jobType']
  payload: T
  status: BackgroundJobStatus
  attempt: number
  createdAt: Date
  updatedAt: Date
}

export type StoreBackgroundJob = (args: {
  job: BackgroundJob<BackgroundJobPayload>
}) => Promise<void>

export type GetBackgroundJob<T extends BackgroundJobPayload = BackgroundJobPayload> =
  (args: { jobId: string }) => Promise<BackgroundJob<T> | null>
