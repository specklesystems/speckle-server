import express from 'express'
import puppeteer, { Browser } from 'puppeteer'
import { REDIS_URL, PORT, CHROMIUM_EXECUTABLE_PATH, PREVIEWS_HEADED } from './config'
import Bull from 'bull'
import { jobPayload, jobProcessor } from './jobProcessor'

const app = express()
const port = PORT

// serve the preview-frontend
app.use(express.static('public'))

const server = app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const launchBrowser = async (): Promise<Browser> => {
  console.log('Starting browser')
  return await puppeteer.launch({
    headless: !PREVIEWS_HEADED,
    executablePath: CHROMIUM_EXECUTABLE_PATH
  })
}
const browser = await launchBrowser()
console.log('Starting message queues')
const jobQueue = new Bull('preview-service-jobs', REDIS_URL)
const resultsQueue = new Bull('preview-service-results', REDIS_URL)

jobQueue.process(async (job, done) => {
  console.log(`Picking up job ${job.id}`)
  const payload = jobPayload.parse(job.data)
  const result = await jobProcessor(browser, payload)
  await resultsQueue.add(result)
  done()
})

process.on('SIGINT', async () => {
  console.log('Ctrl-C was pressed')
  browser.close()
  server.close(() => {
    console.log('Exiting the express server')
    process.exit()
  })
})
