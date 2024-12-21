import express from 'express'
import puppeteer, { Browser } from 'puppeteer'
import { REDIS_URL, PORT, CHROMIUM_EXECUTABLE_PATH, PREVIEWS_HEADED } from './config.js'
import Bull from 'bull'
import { logger } from './logging.js'
import { jobProcessor } from './jobProcessor.js'

const app = express()
const port = PORT

// serve the preview-frontend
app.use(express.static('public'))

const server = app.listen(port, () => {
  logger.info('📡 Started Preview Service server')
})

const launchBrowser = async (): Promise<Browser> => {
  logger.debug('Starting browser')
  return await puppeteer.launch({
    headless: !PREVIEWS_HEADED,
    executablePath: CHROMIUM_EXECUTABLE_PATH
  })
}
const browser = await launchBrowser()
logger.debug('Starting message queues')
const jobQueue = new Bull('preview-service-jobs', REDIS_URL)
// TODO: this should be a dynamic result queue based on an input from the job
const resultsQueue = new Bull('preview-service-results', REDIS_URL)

jobQueue.process(async (payload, done) => {
  const result = await jobProcessor({ logger, browser, payload })
  await resultsQueue.add(result)
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
