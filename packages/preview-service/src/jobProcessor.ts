import { Page, Browser } from 'puppeteer'
import { PreviewGenerator } from '@speckle/shared/dist/esm/previews/interface.js'
import {
  JobPayload,
  PreviewResultPayload,
  PreviewSuccessPayload
} from '@speckle/shared/dist/esm/previews/job.js'
import { Logger } from 'pino'
import { PORT } from '@/config'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends PreviewGenerator {}
}

export const jobProcessor = async ({
  logger,
  browser,
  job
}: {
  logger: Logger
  browser: Browser
  job: JobPayload
}): Promise<PreviewResultPayload> => {
  const jobId = job.jobId
  const jobLogger = logger.child({ jobId, serverUrl: job.url })
  const start = new Date()
  jobLogger.info('Picked up job {jobId} for {serverUrl}')

  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()

    const result = await pageFunction({ page, job, jobLogger })
    const elapsed = (new Date().getTime() - start.getTime()) / 1000
    jobLogger.info(
      { status: result.status, elapsed },
      'Processes job {jobId} with result {status}. It took {elapsed} seconds.'
    )
    return result
  } catch (err) {
    const elapsed = (new Date().getTime() - start.getTime()) / 1000
    jobLogger.error(
      { err, elapsed },
      'Failed to process {jobId} job. It took {elapsed} seconds'
    )
    const reason =
      err instanceof Error
        ? err.stack ?? err.toString()
        : err instanceof Object
        ? err.toString()
        : 'unknown error'

    return {
      jobId: job.jobId,
      status: 'error',
      result: {
        durationSeconds: elapsed
      },
      reason
    }
  } finally {
    await page?.close()
  }
}

const pageFunction = async ({
  page,
  job,
  jobLogger
}: {
  page: Page
  job: JobPayload
  jobLogger: Logger
}): Promise<PreviewSuccessPayload> => {
  page.on('error', (err) => {
    jobLogger.error({ err }, 'Page crashed')
    throw err
  })
  await page.goto(`http://127.0.0.1:${PORT}/index.html`)
  // page.setDefaultTimeout(deps.timeoutMilliseconds)

  const previewResult = await page.evaluate(async (job: JobPayload) => {
    await window.load(job)
    return await window.takeScreenshot()
  }, job)

  return { jobId: job.jobId, status: 'success', result: previewResult }
}
