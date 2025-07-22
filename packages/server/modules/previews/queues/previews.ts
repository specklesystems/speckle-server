import type {
  BuildUpdateObjectPreview,
  GetNumberOfJobsInRequestQueue,
  RequestObjectPreview
} from '@/modules/previews/domain/operations'
import type { Logger } from '@/observability/logging'
import type { Queue, Job } from 'bull'
import { PreviewStatus } from '@/modules/previews/domain/consts'
import type { JobPayload } from '@speckle/shared/workers/previews'
import { fromJobId } from '@speckle/shared/workers/previews'

export const requestObjectPreviewFactory =
  ({
    responseQueue,
    queue
  }: {
    responseQueue: string
    queue: Queue<JobPayload>
  }): RequestObjectPreview =>
  async ({ jobId, token, url }) => {
    const payload = { jobId, token, url, responseQueue }
    await queue.add(payload, { removeOnComplete: true, attempts: 3 })
  }

export const requestErrorHandlerFactory =
  (deps: { logger: Logger }) => (err: Error) => {
    deps.logger.error(
      { err },
      'Preview generation resulted in an error due to the Redis backend.'
    )
  }

export const requestActiveHandlerFactory = (deps: { logger: Logger }) => (job: Job) => {
  const jobId = 'jobId' in job.data ? job.data.jobId : undefined
  deps.logger.info({ jobId }, 'Preview job {jobId} processing started.')
}

export const requestFailedHandlerFactory =
  (deps: { logger: Logger; buildUpdateObjectPreview: BuildUpdateObjectPreview }) =>
  async (job: Job, err: Error) => {
    const { logger, buildUpdateObjectPreview } = deps
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.error({ err, jobId }, 'Preview job {jobId} failed.')
    if (!jobId) return
    const { projectId, objectId } = fromJobId(jobId)
    const updateObjectPreview = await buildUpdateObjectPreview({ projectId })
    const updatedRecords = await updateObjectPreview({
      objectPreview: {
        streamId: projectId,
        objectId,
        previewStatus: PreviewStatus.ERROR
      }
    })
    if (updatedRecords.length < 1) {
      logger.warn(
        { projectId, objectId },
        'No object preview was updated for {projectId}.{objectId} after a failed preview job. This may indicate that the object preview does not exist or that the project does not exist, or has moved regions.'
      )
    }
    if (updatedRecords.length > 1) {
      logger.warn(
        { projectId, objectId, updatedRecords },
        'Multiple object previews were updated for {projectId}.{objectId} after a failed preview job. This may indicate a data integrity issue.'
      )
    }
  }

export const getNumberOfJobsInQueueFactory =
  (deps: { queue: Queue<JobPayload> }): GetNumberOfJobsInRequestQueue =>
  async () => {
    const counts = await deps.queue.getJobCounts()
    return counts.waiting + counts.active + counts.delayed
  }
