import type {
  BuildUpsertObjectPreview,
  RequestObjectPreview
} from '@/modules/previews/domain/operations'
import type { Logger } from '@/observability/logging'
import type { Queue, Job } from 'bull'
import { PreviewStatus } from '@/modules/previews/domain/consts'
import { JobPayload } from '@speckle/shared/workers/previews'

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
    deps.logger.error({ err }, 'Preview generation failed')
  }

export const requestActiveHandlerFactory = (deps: { logger: Logger }) => (job: Job) => {
  const jobId = 'jobId' in job.data ? job.data.jobId : undefined
  deps.logger.info({ jobId }, 'Preview job {jobId} processing started.')
}

export const requestFailedHandlerFactory =
  (deps: { logger: Logger; buildUpsertObjectPreview: BuildUpsertObjectPreview }) =>
  async (job: Job, err: Error) => {
    const { logger, buildUpsertObjectPreview } = deps
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.error({ err, jobId }, 'Preview job {jobId} failed.')
    if (!jobId) return
    const [projectId, objectId] = jobId.split('.')
    const upsertObjectPreview = await buildUpsertObjectPreview(projectId)
    await upsertObjectPreview({
      objectPreview: {
        streamId: projectId,
        objectId,
        previewStatus: PreviewStatus.ERROR,
        lastUpdate: new Date()
      }
    })
  }
