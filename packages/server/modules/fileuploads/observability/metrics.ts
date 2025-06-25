import { TIME } from '@speckle/shared'
import Bull from 'bull'
import { type Registry, Counter, Summary, Gauge } from 'prom-client'
import type { FileImportQueue } from '@/modules/fileuploads/domain/types'
import { FileImportResultPayload } from '@speckle/shared/workers/fileimport'

export const FileImportJobDurationStep = {
  TOTAL: 'total',
  DOWNLOAD: 'download', // time take to download the file from the blob storage
  PARSE: 'parse' // time taken by the parser to process the file, including sending the objects
} as const

export type ObserveResult = (params: { jobResult: FileImportResultPayload }) => void

export const initializeMetrics = (params: {
  registers: Registry[]
  requestQueues: (FileImportQueue & { queue: Bull.Queue })[]
}) => {
  const { registers, requestQueues } = params

  // ======= Request Queue =======
  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_request_queue_pending')
  )
  new Gauge<'parser'>({
    name: 'speckle_server_file_import_jobs_request_queue_pending',
    help: 'Number of file import jobs waiting in the job request queue',
    labelNames: ['parser'],
    registers,
    async collect() {
      requestQueues.forEach(async (requestQueue) => {
        this.set({ parser: requestQueue.label }, await requestQueue.queue.count())
      })
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_request_waiting_count')
  )
  new Gauge<'parser'>({
    name: 'speckle_server_file_import_jobs_request_waiting_count',
    help: 'Total number of file import jobs which have been added to the queue to be processed (and are in a waiting state).',
    labelNames: ['parser'],
    registers,
    async collect() {
      requestQueues.forEach(async (requestQueue) => {
        this.set(
          { parser: requestQueue.label },
          await requestQueue.queue.getWaitingCount()
        )
      })
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_request_active_count')
  )
  new Gauge<'parser'>({
    name: 'speckle_server_file_import_jobs_request_active_count',
    help: 'Total number of file import jobs which have been requested and were being processed (are in an active state).',
    labelNames: ['parser'],
    registers,
    async collect() {
      requestQueues.forEach(async (requestQueue) => {
        this.set(
          { parser: requestQueue.label },
          await requestQueue.queue.getActiveCount()
        )
      })
    }
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_request_completed_count')
  )
  const fileImportJobsRequestCompletedCounter = new Counter<'parser'>({
    name: 'speckle_server_file_import_jobs_request_completed_count',
    help: 'Total number of file import jobs which have been requested and were successfully completed by a worker.',
    labelNames: ['parser'],
    registers
  })

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_request_failed_count')
  )
  const fileImportJobsRequestFailedCounter = new Counter<'parser'>({
    name: 'speckle_server_file_import_jobs_request_failed_count',
    help: 'Total number of file import jobs which have been requested and were not successful (failed).',
    labelNames: ['parser'],
    registers
  })

  const completedHandlerFactory = (queueLabel: string) => () => {
    fileImportJobsRequestCompletedCounter.inc({ parser: queueLabel })
  }

  const failedHandlerFactory = (queueLabel: string) => () => {
    fileImportJobsRequestFailedCounter.inc({ parser: queueLabel })
  }

  requestQueues.forEach((requestQueue) => {
    const completedHandler = completedHandlerFactory(requestQueue.label)
    const failedHandler = failedHandlerFactory(requestQueue.label)

    requestQueue.queue.removeListener('completed', completedHandler)
    requestQueue.queue.on('completed', completedHandler)
    requestQueue.queue.removeListener('failed', failedHandler)
    requestQueue.queue.on('failed', failedHandler)
  })

  // ======= Responses =======

  registers.forEach((r) =>
    r.removeSingleMetric('speckle_server_file_import_jobs_processed_duration_seconds')
  )
  const fileImportJobsProcessedSummary = new Summary<'status' | 'step' | 'parser'>({
    name: 'speckle_server_file_import_jobs_processed_duration_seconds',
    help: 'Duration of file import job processing, in seconds, as sampled over a moving window of 1 minute.',
    registers,
    labelNames: ['status', 'step', 'parser'],
    maxAgeSeconds: 1 * TIME.minute,
    ageBuckets: 5
  })

  const observeResult: ObserveResult = (params) => {
    const { jobResult } = params
    fileImportJobsProcessedSummary.observe(
      {
        parser: jobResult.result.parser,
        status: jobResult.status,
        step: FileImportJobDurationStep.TOTAL
      },
      jobResult.result.durationSeconds * TIME.second
    )

    fileImportJobsProcessedSummary.observe(
      {
        parser: jobResult.result.parser,
        status: jobResult.status,
        step: FileImportJobDurationStep.DOWNLOAD
      },
      jobResult.result.downloadDurationSeconds * TIME.second
    )

    fileImportJobsProcessedSummary.observe(
      {
        parser: jobResult.result.parser,
        status: jobResult.status,
        step: FileImportJobDurationStep.PARSE
      },
      jobResult.result.parseDurationSeconds * TIME.second
    )
  }

  return { observeResult }
}
