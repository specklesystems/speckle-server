import Bull from 'bull'
import { type Registry, Counter, Summary, Gauge } from 'prom-client'

export const initializeMetrics = (params: {
  registers: Registry[]
  previewRequestQueue: Bull.Queue
}) => {
  const { registers, previewRequestQueue } = params
  // add a metric to gauge the length of the preview job queue
  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_queue_pending')
  )
  new Gauge({
    name: 'speckle_server_preview_jobs_queue_pending',
    help: 'Number of preview jobs waiting in the job queue',
    async collect() {
      this.set(await previewRequestQueue.count())
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_waiting_count')
  )
  const previewJobsWaitingCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_waiting_count',
    help: 'Total number of preview jobs which have been added to the queue to be processed (and are in a waiting state).'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_active_count')
  )
  const previewJobsActiveCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_active_count',
    help: 'Total number of preview jobs which have been requested and were being processed (are in an active state).'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_completed_count')
  )
  const previewJobsCompletedCounter = new Counter({
    name: 'speckle_server_preview_jobs_completed_count',
    help: 'Total number of preview jobs which have been requested and were successful in being completed by a worker.'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_failed_count')
  )
  const previewJobsFailedCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_failed_count',
    help: 'Total number of preview jobs which have been requested and were not successful (failed).'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_processed_duration_seconds')
  )
  const previewJobsProcessedSummary = new Summary<'status'>({
    name: 'speckle_server_preview_jobs_processed_duration_seconds',
    help: 'Duration of preview job processing, in seconds',
    labelNames: ['status']
  })

  previewRequestQueue.on('waiting', () => {
    previewJobsWaitingCounter.inc()
  })
  previewRequestQueue.on('completed', () => {
    previewJobsCompletedCounter.inc()
  })
  previewRequestQueue.on('active', () => {
    previewJobsActiveCounter.inc()
  })
  previewRequestQueue.on('failed', () => {
    previewJobsFailedCounter.inc()
  })

  return { previewJobsProcessedSummary }
}
