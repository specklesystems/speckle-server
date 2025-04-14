import { TIME } from '@speckle/shared'
import Bull from 'bull'
import { type Registry, Counter, Summary, Gauge } from 'prom-client'

export const PreviewJobDurationStep = {
  TOTAL: 'total',
  LOAD: 'load',
  RENDER: 'render'
} as const

export const initializeMetrics = (params: {
  registers: Registry[]
  previewRequestQueue: Bull.Queue
  previewResponseQueue: Bull.Queue
}) => {
  const { registers, previewRequestQueue, previewResponseQueue } = params

  // ======= Request Queue =======
  // add a metric to gauge the length of the preview job queue
  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_queue_pending')
  )
  new Gauge({
    name: 'speckle_server_preview_jobs_request_queue_pending',
    help: 'Number of preview jobs waiting in the job request queue',
    async collect() {
      this.set(await previewRequestQueue.count())
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_waiting_count')
  )
  const previewJobsRequestWaitingCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_waiting_count',
    help: 'Total number of preview jobs which have been added to the queue to be processed (and are in a waiting state).'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_active_count')
  )
  const previewJobsRequestActiveCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_active_count',
    help: 'Total number of preview jobs which have been requested and were being processed (are in an active state).'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_completed_count')
  )
  const previewJobsRequestCompletedCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_completed_count',
    help: 'Total number of preview jobs which have been requested and were successful in being completed by a worker.'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_failed_count')
  )
  const previewJobsRequestFailedCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_failed_count',
    help: 'Total number of preview jobs which have been requested and were not successful (failed).'
  })

  const waitingHandler = () => {
    previewJobsRequestWaitingCounter.inc()
  }
  previewRequestQueue.removeListener('waiting', waitingHandler)
  previewRequestQueue.on('waiting', waitingHandler)

  const completedHandler = () => {
    previewJobsRequestCompletedCounter.inc()
  }
  previewRequestQueue.removeListener('completed', completedHandler)
  previewRequestQueue.on('completed', completedHandler)

  const activeHandler = () => {
    previewJobsRequestActiveCounter.inc()
  }
  previewRequestQueue.removeListener('active', activeHandler)
  previewRequestQueue.on('active', activeHandler)

  const failedHandler = () => {
    previewJobsRequestFailedCounter.inc()
  }
  previewRequestQueue.removeListener('failed', failedHandler)
  previewRequestQueue.on('failed', failedHandler)

  // ======= Response Queue =======
  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_response_queue_pending')
  )
  new Gauge({
    name: 'speckle_server_preview_jobs_response_queue_pending',
    help: 'Number of responses to preview jobs waiting in the response queue',
    async collect() {
      this.set(await previewResponseQueue.count())
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_response_completed_count')
  )
  const previewJobsResponseCompletedCounter = new Counter({
    name: 'speckle_server_preview_jobs_response_completed_count',
    help: 'Total number of preview jobs which have been responded and the response has been successfully processed.'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_response_failed_count')
  )
  const previewJobsResponseFailedCounter = new Counter({
    name: 'speckle_server_preview_jobs_response_failed_count',
    help: 'Total number of preview jobs which have been responded and the response has not been successfully processed.'
  })

  const responseCompletedHandler = () => {
    previewJobsResponseCompletedCounter.inc()
  }
  previewResponseQueue.removeListener('completed', responseCompletedHandler)
  previewResponseQueue.on('completed', responseCompletedHandler)

  const responseFailedHandler = () => {
    previewJobsResponseFailedCounter.inc()
  }
  previewResponseQueue.removeListener('failed', responseFailedHandler)
  previewResponseQueue.on('failed', responseFailedHandler)

  // ======= Responses =======

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_processed_duration_seconds')
  )
  const previewJobsProcessedSummary = new Summary<'status' | 'step'>({
    name: 'speckle_server_preview_jobs_processed_duration_seconds',
    help: 'Duration of preview job processing, in seconds, as sampled over a moving window of 1 minute.',
    labelNames: ['status', 'step'],
    maxAgeSeconds: 1 * TIME.minute,
    ageBuckets: 5
  })

  return { previewJobsProcessedSummary }
}
