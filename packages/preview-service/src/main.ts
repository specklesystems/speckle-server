import express from 'express'
import puppeteer, { Browser } from 'puppeteer'
import { createTerminus } from '@godaddy/terminus'
import type { Logger } from 'pino'
import { Redis, type RedisOptions } from 'ioredis'
import Bull from 'bull'

import { jobPayload } from '@speckle/shared/dist/esm/previews/job.js'

import {
  REDIS_URL,
  HOST,
  PORT,
  CHROMIUM_EXECUTABLE_PATH,
  PREVIEWS_HEADED,
  USER_DATA_DIR,
  PREVIEW_TIMEOUT
} from '@/config.js'
import { logger } from '@/logging.js'
import { jobProcessor } from '@/jobProcessor.js'
import { AppState } from '@/const.js'
import { initMetrics, initPrometheusRegistry } from '@/metrics.js'

const app = express()
const host = HOST
const port = PORT

let appState: AppState = AppState.STARTING

// serve the preview-frontend
app.use(express.static('public'))
await initMetrics({ app, registry: initPrometheusRegistry() })

let client: Redis
let subscriber: Redis

const opts = {
  // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
  createClient(type: string, redisOpts: RedisOptions) {
    switch (type) {
      case 'client':
        if (!client) {
          client = new Redis(REDIS_URL, redisOpts)
        }
        return client
      case 'subscriber':
        if (!subscriber) {
          subscriber = new Redis(REDIS_URL, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false
          })
        }
        return subscriber
      case 'bclient':
        return new Redis(REDIS_URL, {
          ...redisOpts,
          maxRetriesPerRequest: null,
          enableReadyCheck: false
        })
      default:
        throw new Error('Unexpected connection type: ' + type)
    }
  }
}
const jobQueue = new Bull('preview-service-jobs', opts)

// store this callback, so on shutdown we can error the job
let currentJob: { logger: Logger; done: Bull.DoneCallback } | undefined = undefined

const server = app.listen(port, host, async () => {
  logger.info({ port }, '📡 Started Preview Service server, listening on {port}')
  appState = AppState.RUNNING

  const launchBrowser = async (): Promise<Browser> => {
    logger.debug('Starting browser')
    return await puppeteer.launch({
      headless: !PREVIEWS_HEADED,
      executablePath: CHROMIUM_EXECUTABLE_PATH,
      userDataDir: USER_DATA_DIR,
      // we trust the web content that is running, so can disable the sandbox
      // disabling the sandbox allows us to run the docker image without linux kernel privileges
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      protocolTimeout: PREVIEW_TIMEOUT
    })
  }
  logger.debug('Starting message queues')

  // nothing after this line is getting called, this blocks
  await jobQueue.process(async (payload, done) => {
    let jobLogger = logger.child({ payloadId: payload.id })
    let browser: Browser | undefined = undefined
    try {
      currentJob = { done, logger: jobLogger }
      const parseResult = jobPayload.safeParse(payload.data)
      if (!parseResult.success) {
        jobLogger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { parseError: parseResult.error, payload: payload.data },
          'Invalid job payload'
        )
        return done(parseResult.error)
      }
      const job = parseResult.data
      jobLogger = jobLogger.child({
        jobId: job.jobId,
        jobPriorAttemptsMade: payload.attemptsMade,
        serverUrl: job.url
      })
      const resultsQueue = new Bull(job.responseQueue, opts)

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
      await browser.close()
      browser = undefined
      done()
    } catch (err) {
      if (appState === AppState.SHUTTINGDOWN) {
        // likely that the job was cancelled due to the service shutting down
        jobLogger.warn({ err }, 'Processing {jobId} failed')
      } else {
        jobLogger.error({ err }, 'Processing {jobId} failed')
      }
      if (err instanceof Error) {
        done(err)
      } else {
        throw err
      }
    } finally {
      if (browser) await browser.close()
      browser = undefined
    }
    currentJob = undefined
  })
})

const beforeShutdown = async () => {
  logger.info('🛑 Beginning shut down, pausing all jobs')
  appState = AppState.SHUTTINGDOWN
  // stop accepting new jobs and kill any running jobs
  await jobQueue.pause(
    true, // just pausing this local worker of the queue
    true // do not wait for active jobs to finish
  )

  if (currentJob) {
    currentJob.logger.warn('Cancelling job due to preview-service shutdown')
    currentJob.done(new Error('Job cancelled due to preview-service shutdown'))
  }
}

const onShutdown = async () => {
  logger.info('👋 Completed shut down, now exiting')
}

createTerminus(server, {
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
