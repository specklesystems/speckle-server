import express from 'express'
import puppeteer, { Browser } from 'puppeteer'
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
import Bull from 'bull'
import { logger } from '@/logging.js'
import { jobProcessor } from '@/jobProcessor.js'
import { Redis, RedisOptions } from 'ioredis'
import { jobPayload } from '@speckle/shared/dist/esm/previews/job.js'
import { initMetrics, initPrometheusRegistry } from '@/metrics.js'
import { createTerminus } from '@godaddy/terminus'

const app = express()
const host = HOST
const port = PORT

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
let jobDoneCallback: Bull.DoneCallback | undefined = undefined

const server = app.listen(port, host, async () => {
  logger.info({ port }, '📡 Started Preview Service server, listening on {port}')

  const gpuWithVulkanArgs = [
    '--headless=new',
    '--use-angle=vulkan',
    '--enable-features=Vulkan',
    '--disable-vulkan-surface',
    '--enable-unsafe-webgpu'
  ]

  const launchBrowser = async (): Promise<Browser> => {
    logger.debug('Starting browser')
    return await puppeteer.launch({
      headless: !PREVIEWS_HEADED,
      executablePath: CHROMIUM_EXECUTABLE_PATH,
      userDataDir: USER_DATA_DIR,
      // we trust the web content that is running, so can disable the sandbox
      // disabling the sandbox allows us to run the docker image without linux kernel privileges
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        ...(GPU_ENABLED ? gpuWithVulkanArgs : [])
      ],
      protocolTimeout: PREVIEW_TIMEOUT
    })
  }
  logger.debug('Starting message queues')

  // nothing after this line is getting called, this blocks
  await jobQueue.process(async (payload, done) => {
    let jobLogger = logger.child({ payloadId: payload.id })
    try {
      jobDoneCallback = done
      const browser = await launchBrowser()
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
      jobLogger = jobLogger.child({ jobId: job.jobId, serverUrl: job.url })
      const resultsQueue = new Bull(job.responseQueue, opts)

      const result = await jobProcessor({
        logger: jobLogger,
        browser,
        job: parseResult.data,
        port: PORT,
        timeout: PREVIEW_TIMEOUT
      })

      // with removeOnComplete, the job response potentially containing a large images,
      // is cleared from the response queue
      await resultsQueue.add(result, { removeOnComplete: true })
      await browser.close()
      done()
    } catch (err) {
      jobLogger.error({ err }, 'Processing {jobId} failed')
      if (err instanceof Error) {
        done(err)
      } else {
        throw err
      }
    }
    jobDoneCallback = undefined
  })
})

const beforeShutdown = async () => {
  logger.info('🛑 Beginning shut down, pausing all jobs')
  // stop accepting new jobs and kill any running jobs
  await jobQueue.pause(
    true, // just pausing this local worker of the queue
    true // do not wait for active jobs to finish
  )

  if (jobDoneCallback) {
    logger.warn('Cancelling job due to preview-service shutdown')
    jobDoneCallback(new Error('Job cancelled due to preview-service shutdown'))
  }
}

const onShutdown = async () => {
  logger.info('👋 Completed shut down, now exiting')
}

createTerminus(server, {
  healthChecks: {
    '/liveness': () => Promise.resolve('ok'),
    '/readiness': async (args: { state: { isShuttingDown: boolean } }) => {
      const { isShuttingDown } = args.state
      if (isShuttingDown) {
        return Promise.reject(new Error('Preview service is shutting down'))
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
