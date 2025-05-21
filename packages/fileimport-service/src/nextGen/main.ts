import { AppState } from '@speckle/shared/workers'
import { initializeQueue } from '@speckle/shared/queue'
import { FILEIMPORT_TIMEOUT, REDIS_URL } from '@/nextGen/config.js'
import type {
  JobPayload,
  FileImportResultPayload
} from '@speckle/shared/workers/fileimport'
import type Bull from 'bull'
import { logger } from '@/observability/logging.js'
import { Logger } from 'pino'
import { ensureError, TIME_MS } from '@speckle/shared'
import { jobProcessor } from './jobProcessor.js'

const JobQueueName = 'fileimport-service-jobs'
let jobQueue: Bull.Queue<JobPayload> | undefined = undefined
let appState: AppState = AppState.STARTING
let currentJob: { logger: Logger; done: Bull.DoneCallback } | undefined = undefined

export const main = async () => {
  // we discussed doing push based metrics from here
  // await initMetrics({ app, registry: initPrometheusRegistry() })

  // store this callback, so on shutdown we can error the job

  try {
    jobQueue = await initializeQueue<JobPayload>({
      queueName: JobQueueName,
      redisUrl: REDIS_URL
    })
  } catch (e) {
    const err = ensureError(e, 'Unknown error creating job queue')
    logger.error({ err }, 'Error creating job queue')

    // the callback to server.listen has failed, so we need to exit the process and not just return
    await beforeShutdown() // handle the shutdown gracefully
    onShutdown()
    process.exit(1)
  }
  appState = AppState.RUNNING
  logger.debug(`Starting processing of "${JobQueueName}" message queue`)

  await jobQueue.process(async (payload, done) => {
    const elapsed = (() => {
      const start = new Date().getTime()
      return () => (new Date().getTime() - start) / TIME_MS.second
    })()
    let encounteredError = false
    let jobLogger = logger.child({
      payloadId: payload.id,
      jobPriorAttemptsMade: payload.attemptsMade
    })

    const job = payload.data
    try {
      currentJob = { done, logger: jobLogger }
      jobLogger = jobLogger.child({
        jobId: job.jobId,
        serverUrl: job.serverUrl
      })
      const result = await jobProcessor({
        job,
        logger,
        timeout: FILEIMPORT_TIMEOUT,
        getAppState: () => appState,
        getElapsed: elapsed
      })
      await sendResult({
        ...job,
        result
      })
    } catch (err) {
      if (appState === AppState.SHUTTINGDOWN) {
        // likely that the job was cancelled due to the service shutting down
        jobLogger.warn({ err }, 'Processing {jobId} failed')
      } else {
        jobLogger.error({ err }, 'Processing {jobId} failed')
      }
      if (err instanceof Error) {
        encounteredError = true
        done(err)
        await sendResult({
          ...job,
          result: {
            status: 'error',
            reason: err.message,
            result: {
              durationSeconds: 0
            }
          }
        })
      } else {
        throw err
      }
    } finally {
      if (!encounteredError) done()
      currentJob = undefined
    }
  })
}

const sendResult = async ({
  serverUrl,
  projectId,
  jobId,
  token,
  result
}: {
  serverUrl: string
  projectId: string
  jobId: string
  token: string
  result: FileImportResultPayload
}) => {
  const response = await fetch(
    `${serverUrl}/api/projects/${projectId}/fileimporter/jobs/${jobId}/results`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },

      body: JSON.stringify(result)
    }
  )
  if (!response.ok) {
    const text = await response.text()
    currentJob?.logger.error({ cause: text }, 'Failed to report job result')
    throw new Error(`Failed to report job result: ${text}`)
  }
}

const beforeShutdown = async () => {
  logger.info('🛑 Beginning shut down, pausing all jobs')
  appState = AppState.SHUTTINGDOWN
  // stop accepting new jobs and kill any running jobs
  if (jobQueue) {
    await jobQueue.pause(
      true, // just pausing this local worker of the queue
      true // do not wait for active jobs to finish
    )
  }

  if (currentJob) {
    currentJob.logger.warn('Cancelling job due to fileimport-service shutdown')
    currentJob.done(new Error('Job cancelled due to fileimport-service shutdown'))
  }
  // no need to close the job queue and redis client, when the process exits they will be closed automatically
}

const onShutdown = () => {
  logger.info('👋 Completed shut down, now exiting')
}
