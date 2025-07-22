import puppeteer, { Browser } from 'puppeteer'
import { JobPayload, PreviewResultPayload } from '@speckle/shared/workers/previews'
import { AppState } from '@speckle/shared/workers'
import type Bull from 'bull'
import {
  REDIS_URL,
  HOST,
  PORT,
  CHROMIUM_EXECUTABLE_PATH,
  PREVIEWS_HEADED,
  USER_DATA_DIR,
  PREVIEW_TIMEOUT,
  GPU_ENABLED
} from '@/config.js'

import { jobProcessor } from '@/jobProcessor.js'
import { initializeQueue } from '@speckle/shared/queue'
import { Express } from 'express'
import { logger } from '@/logging.js'
import { Logger } from 'pino'
const JobQueueName = 'preview-service-jobs'
import { ensureError } from '@speckle/shared'
import { createTerminus } from '@godaddy/terminus'
import { isRedisReady } from '@speckle/shared/redis'
import { Server } from 'http'

let appState: AppState = AppState.STARTING

let jobQueue: Bull.Queue<JobPayload> | undefined = undefined

// store this callback, so on shutdown we can error the job
let currentJob: { logger: Logger; done: Bull.DoneCallback } | undefined = undefined

// browser is a global variable, so we can handle the shutdown of the browser
// in the beforeShutdown function. We need to stop processing jobs before we
// can close the browser
let browser: Browser | undefined = undefined

export const buildServer = ({
  port,
  host,
  app
}: Partial<{ port: number; host: string }> & { app: Express }) =>
  app.listen(port || PORT, host || HOST, async () => {
    logger.info({ port }, '📡 Started Preview Service server, listening on {port}')
    appState = AppState.RUNNING

    const gpuArgs = ['--use-gl=angle', '--use-angle=gl-egl']

    const launchBrowser = async (): Promise<Browser> => {
      const launchArguments = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-session-crashed-bubble',
        ...(GPU_ENABLED ? gpuArgs : [])
      ]
      logger.debug(
        `Starting browser, located at "${CHROMIUM_EXECUTABLE_PATH}", with the following arguments: ${JSON.stringify(
          launchArguments
        )}`
      )
      return await puppeteer.launch({
        headless: !PREVIEWS_HEADED,
        executablePath: CHROMIUM_EXECUTABLE_PATH,
        userDataDir: USER_DATA_DIR,
        // slowMo: 3000, // Use for debugging during development
        // we trust the web content that is running, so can disable the sandbox
        // disabling the sandbox allows us to run the docker image without linux kernel privileges
        args: launchArguments,
        protocolTimeout: PREVIEW_TIMEOUT,
        // handle closing of the browser by the preview-service, not puppeteer
        // this is important for the preview-service to be able to shut down gracefully,
        // otherwise we end up in race condition where puppeteer closes before preview-service
        handleSIGHUP: false,
        handleSIGINT: false,
        handleSIGTERM: false
      })
    }

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
      await onShutdown()
      process.exit(1)
    }
    logger.debug(`Starting processing of "${JobQueueName}" message queue`)

    // nothing after this line is getting called, this blocks
    await jobQueue.process(async (payload, done) => {
      let encounteredError = false
      let jobLogger = logger.child({
        payloadId: payload.id,
        jobPriorAttemptsMade: payload.attemptsMade
      })

      if (browser) {
        const message = 'Tried to start job but Browser is already open.'
        done(new Error(message))
        throw new Error(message)
      }

      try {
        currentJob = { done, logger: jobLogger }
        const job = payload.data
        jobLogger = jobLogger.child({
          jobId: job.jobId,
          serverUrl: job.url
        })
        const resultsQueue = await initializeQueue<PreviewResultPayload>({
          queueName: job.responseQueue,
          redisUrl: REDIS_URL
        })

        browser = await launchBrowser()
        const result = await jobProcessor({
          logger: jobLogger,
          browser,
          job,
          port: PORT,
          timeout: PREVIEW_TIMEOUT,
          getAppState: () => appState
        })

        // with removeOnComplete, the job response potentially containing a large images,
        // is cleared from the response queue
        await resultsQueue.add(result, { removeOnComplete: true })
      } catch (err) {
        if (appState === AppState.SHUTTINGDOWN) {
          // likely that the job was cancelled due to the service shutting down
          jobLogger.warn({ err }, 'Processing job {jobId} failed')
        } else {
          jobLogger.error({ err }, 'Processing job {jobId} failed')
        }
        if (err instanceof Error) {
          encounteredError = true
          done(err)
        } else {
          throw err
        }
      } finally {
        if (browser) await browser.close()
        browser = undefined
        if (!encounteredError) done()
        currentJob = undefined
      }
    })
  })

export const initServer = (server: Server) =>
  createTerminus(server, {
    healthChecks: {
      '/liveness': () => Promise.resolve('ok'),
      '/readiness': isReady
    },
    beforeShutdown,
    onShutdown,
    logger: (msg, err) => {
      if (err) {
        logger.error({ err }, msg)
        return
      }
      logger.info(msg)
    }
  })

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
    currentJob.logger.warn('Cancelling job due to preview-service shutdown')
    currentJob.done(new Error('Job cancelled due to preview-service shutdown'))
  }
  if (browser) {
    // preview-service is responsible for closing the browser
    // to allow us to stop listening for new jobs and properly respond to any
    // current job before we kill the browser
    logger.info('Closing browser')
    await browser.close()
    browser = undefined
  }
  // no need to close the job queue and redis client, when the process exits they will be closed automatically
}

const onShutdown = async () => {
  logger.info('👋 Completed shut down, now exiting')
}

const isReady = async (args: { state: { isShuttingDown: boolean } }) => {
  const { isShuttingDown } = args.state
  if (isShuttingDown) {
    return Promise.reject(new Error('Preview service is shutting down'))
  }

  if (!jobQueue) {
    return Promise.reject(new Error('Job queue is not initialized'))
  }

  try {
    await isRedisReady(jobQueue.client)
  } catch (e) {
    return Promise.reject(ensureError(e, 'Unknown error when checking Redis client'))
  }
  const isReady = await jobQueue.isReady()
  if (!isReady)
    return Promise.reject(
      new Error(
        'Preview service is not ready. Redis or Bull is not either reachable or ready.'
      )
    )

  return Promise.resolve('ok')
}
