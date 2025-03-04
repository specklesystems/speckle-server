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

  registers.forEach((r) => r.removeSingleMetric('speckle_server_preview_jobs_count'))
  const previewJobsCounter = new Counter({
    name: 'speckle_server_preview_jobs_count',
    help: 'Total number of preview jobs which have been requested to be processed.'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_request_failed_count')
  )
  const previewJobsFailedCounter = new Counter({
    name: 'speckle_server_preview_jobs_request_failed_count',
    help: 'Total number of preview jobs which have been requested but failed to be processed.'
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_preview_jobs_processed_duration_seconds')
  )
  const previewJobsProcessedSummary = new Summary<'status'>({
    name: 'speckle_server_preview_jobs_processed_duration_seconds',
    help: 'Duration of preview job processing, in seconds',
    labelNames: ['status']
  })

  previewRequestQueue.on('added', () => {
    previewJobsCounter.inc()
  })
  previewRequestQueue.on('failed', () => {
    previewJobsFailedCounter.inc()
  })

  return { previewJobsProcessedSummary }
}
