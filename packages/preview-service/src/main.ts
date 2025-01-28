import express from 'express'
import puppeteer, { Browser } from 'puppeteer'
import {
  REDIS_URL,
  PORT,
  CHROMIUM_EXECUTABLE_PATH,
  PREVIEWS_HEADED,
  USER_DATA_DIR
} from '@/config.js'
import Bull from 'bull'
import { logger } from '@/logging.js'
import { jobProcessor } from '@/jobProcessor.js'
import { Redis, RedisOptions } from 'ioredis'
import { jobPayload } from '@speckle/shared/dist/esm/previews/job.js'

const app = express()
const port = PORT

// serve the preview-frontend
app.use(express.static('public'))

const server = app.listen(port, () => {
  logger.info({ port }, '📡 Started Preview Service server, listening on {port}')
})

const launchBrowser = async (): Promise<Browser> => {
  logger.debug('Starting browser')
  return await puppeteer.launch({
    headless: !PREVIEWS_HEADED,
    executablePath: CHROMIUM_EXECUTABLE_PATH,
    userDataDir: USER_DATA_DIR,
    // we trust the web content that is running, so can disable the sandbox
    // disabling the sandbox allows us to run the docker image without linux kernel privileges
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })
}
const browser = await launchBrowser()
logger.debug('Starting message queues')

let client: Redis
let subscriber: Redis

const opts = {
  // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
  createClient: function (type: string, redisOpts: RedisOptions) {
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

jobQueue.process(async (payload, done) => {
  const parseResult = jobPayload.safeParse(payload.data)
  if (!parseResult.success) {
    logger.error({ parseError: parseResult.error }, 'Invalid job payload')
    return done(parseResult.error)
  }
  const job = parseResult.data
  const result = await jobProcessor({ logger, browser, job: parseResult.data })

  const resultsQueue = new Bull(job.responseQueue, opts)
  // with removeOnComplete, the job response potentially containing a large images,
  // is cleared from the response queue
  await resultsQueue.add(result, { removeOnComplete: true })
  done()
})

process.on('SIGINT', async () => {
  logger.info('Received signal to shut down')
  browser.close()
  server.close(() => {
    logger.debug('Exiting the express server')
    process.exit()
  })
})
