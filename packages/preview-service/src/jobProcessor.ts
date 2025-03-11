import { Page, Browser } from 'puppeteer'
import { PreviewGenerator } from '@speckle/shared/dist/esm/previews/interface.js'
import {
  JobPayload,
  PreviewResultPayload,
  PreviewSuccessPayload
} from '@speckle/shared/dist/esm/previews/job.js'
import { Logger } from 'pino'
import { timeoutAt } from '@speckle/shared'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window extends PreviewGenerator {}
}

type SharedArgs = {
  job: JobPayload
  port: number
  timeout: number
  logger: Logger
}

type JobArgs = SharedArgs & {
  browser: Browser
}

type PageArgs = SharedArgs & {
  page: Page
}

export const jobProcessor = async ({
  logger,
  browser,
  job,
  port,
  timeout
}: JobArgs): Promise<PreviewResultPayload> => {
  const start = new Date()
  logger.info('Picked up job {jobId} for {serverUrl}')

  const jobMessage =
    'Processed job {jobId} with result {status}. It took {elapsed} seconds.'
  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()

    const result = await pageFunction({ page, job, logger, port, timeout })
    const elapsed = (new Date().getTime() - start.getTime()) / 1000
    logger.info({ status: result.status, elapsed }, jobMessage)
    return result
  } catch (err) {
    const elapsed = (new Date().getTime() - start.getTime()) / 1000
    logger.error({ err, elapsed }, jobMessage)
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
  port,
  timeout,
  logger
}: PageArgs): Promise<PreviewSuccessPayload> => {
  page.on('error', (err) => {
    logger.error({ err }, 'Page crashed')
    throw err
  })
  await page.goto(`http://127.0.0.1:${port}/index.html`)
  page.setDefaultTimeout(timeout)
  const previewResult = await page.evaluate(async (job: JobPayload) => {
    await window.load(job)
    return await window.takeScreenshot()
  }, job)

  return { jobId: job.jobId, status: 'success', result: previewResult }
}
