import type { RequestObjectPreview } from '@/modules/previews/domain/operations'
import type { Logger } from '@/observability/logging'
import type { Queue, Job } from 'bull'
import type { EventEmitter } from 'stream'
import { upsertObjectPreviewFactory } from '@/modules/previews/repository/previews'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { PreviewStatus } from '@/modules/previews/domain/consts'

export const requestObjectPreviewFactory =
  ({
    responseQueue,
    queue
  }: {
    responseQueue: string
    queue: Queue
  }): RequestObjectPreview =>
  async ({ jobId, token, url }) => {
    const payload = { jobId, token, url, responseQueue }
    await queue.add(payload, { removeOnComplete: true, attempts: 3 })
  }

interface QueueEventEmitter extends EventEmitter {}

export const addRequestQueueListeners = (params: {
  logger: Logger
  previewRequestQueue: QueueEventEmitter
}) => {
  const { logger, previewRequestQueue } = params

  const requestErrorHandler = (err: Error) => {
    logger.error({ err }, 'Preview generation failed')
  }
  previewRequestQueue.removeListener('error', requestErrorHandler)
  previewRequestQueue.on('error', requestErrorHandler)

  const requestFailedHandler = async (job: Job, err: Error) => {
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.error({ err, jobId }, 'Preview job {jobId} failed.')
    if (!jobId) return
    const [projectId, objectId] = jobId.split('.')
    const projectDb = await getProjectDbClient({ projectId })
    upsertObjectPreviewFactory({ db: projectDb })({
      objectPreview: {
        streamId: projectId,
        objectId,
        previewStatus: PreviewStatus.ERROR,
        lastUpdate: new Date()
      }
    })
  }
  previewRequestQueue.removeListener('failed', requestFailedHandler)
  previewRequestQueue.on('failed', requestFailedHandler)

  const requestActiveHandler = (job: Job) => {
    const jobId = 'jobId' in job.data ? job.data.jobId : undefined
    logger.info({ jobId }, 'Preview job {jobId} processing started.')
  }
  previewRequestQueue.removeListener('active', requestActiveHandler)
  previewRequestQueue.on('active', requestActiveHandler)
}
