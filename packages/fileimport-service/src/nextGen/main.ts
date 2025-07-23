import { AppState } from '@speckle/shared/workers'
import { initializeQueue } from '@speckle/shared/queue'
import { FILE_IMPORT_TIME_LIMIT_MIN, REDIS_URL, QUEUE_NAME } from '@/nextGen/config.js'
import type {
  JobPayload,
  FileImportResultPayload
} from '@speckle/shared/workers/fileimport'
import type Bull from 'bull'
import { logger } from '@/observability/logging.js'
import { Logger } from 'pino'
import { ensureError, TIME_MS } from '@speckle/shared'
import { jobProcessor } from './jobProcessor.js'
import { startHealthCheckServer } from './healthcheck.js'

let jobQueue: Bull.Queue<JobPayload> | undefined = undefined
let appState: AppState = AppState.STARTING
let currentJob: { logger: Logger; done: Bull.DoneCallback } | undefined = undefined
let healthCheckServer: ReturnType<typeof startHealthCheckServer> | undefined

export const main = async () => {
  logger.info('Starting FileUploads Service (nextGen 🚀)...')
  // we discussed doing push based metrics from here
  // await initMetrics({ app, registry: initPrometheusRegistry() })

  // store this callback, so on shutdown we can error the job

  try {
    jobQueue = await initializeQueue<JobPayload>({
      queueName: QUEUE_NAME,
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

  healthCheckServer = startHealthCheckServer({ logger })

  logger.debug(`Starting processing of "${QUEUE_NAME}" message queue`)

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
        timeout: FILE_IMPORT_TIME_LIMIT_MIN * TIME_MS.minute,
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
        jobLogger.warn({ err }, 'Processing job {jobId} failed')
      } else {
        jobLogger.error({ err }, 'Processing job {jobId} failed')
      }
      if (err instanceof Error) {
        encounteredError = true
        try {
          await sendResult({
            ...job,
            result: {
              status: 'error',
              reason: err.message,
              result: {
                durationSeconds: 0,
                downloadDurationSeconds: 0,
                parseDurationSeconds: 0,
                parser: 'none'
              }
            }
          })
        } catch (sendErr) {
          jobLogger.fatal({ err: sendErr }, 'Failed to send result for job {jobId}')
        } finally {
          done(err)
        }
      } else {
        throw err
      }
    } finally {
      if (!encounteredError) done()
      currentJob = undefined
    }
  })
}

type GQLResponse = { data?: { fileUploadMutations?: { finishFileImport?: boolean } } }

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
  const gqlEndpoint = new URL(`/graphql`, serverUrl).toString()
  const mutation = `
    mutation ($input: FinishFileImportInput!) {
      fileUploadMutations {
        finishFileImport(input: $input)
      }
    }
  `
  const input = {
    jobId,
    projectId,
    ...result
  }

  const response = await fetch(gqlEndpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input
      }
    })
  })

  const json = (await response.json()) as GQLResponse

  if (
    response.status !== 200 ||
    json?.data?.fileUploadMutations?.finishFileImport !== true
  ) {
    const text = await response.text()
    currentJob?.logger.error(
      { cause: text, sendResultUrl: gqlEndpoint, jobId, projectId },
      'Failed to report result for job {jobId} to {sendResultUrl}'
    )
    throw new Error(`Failed to report result for job ${jobId}: ${text}`)
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

  if (healthCheckServer) {
    logger.info('Stopping health check server')
    healthCheckServer.close(() => {
      logger.info('Health check server stopped')
    })
  }
}

const onShutdown = () => {
  logger.info('👋 Completed shut down, now exiting')
}
