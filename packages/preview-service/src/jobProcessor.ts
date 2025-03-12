import { Page, Browser } from 'puppeteer'
import { PreviewGenerator } from '@speckle/shared/dist/esm/previews/interface.js'
import {
  JobPayload,
  PreviewResultPayload
} from '@speckle/shared/dist/esm/previews/job.js'
import { Logger } from 'pino'

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
  } catch (err: unknown) {
    const elapsed = (new Date().getTime() - start.getTime()) / 1000
    logger.error({ err, elapsed }, jobMessage)
    const reason =
      err instanceof Error
        ? err.stack ?? err.toString()
        : typeof err === 'object' && err !== null
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
}: PageArgs): Promise<PreviewResultPayload> => {
  page.on('error', (err) => {
    logger.error({ err }, 'Page crashed')
    throw err
  })
  const start = new Date().getTime()
  await page.goto(`http://127.0.0.1:${port}/index.html`)
  page.setDefaultTimeout(timeout)
  const previewResult = await page.evaluate(async (job: JobPayload) => {
    // ====================
    // This code runs in the browser context
    // ====================
    let loadDone = 0
    let loadDurationSeconds = 0
    try {
      await window.load(job)
      loadDone = new Date().getTime()
      loadDurationSeconds = loadDone - start
    } catch (e) {
      const loadErrored = new Date().getTime()
      const err =
        e instanceof Error
          ? e
          : new Error('Unknown error in preview generation while loading the object')

      return {
        reason: err.message,
        screenshots: {},
        loadDurationSeconds: loadErrored - start,
        durationSeconds: loadErrored - start
      }
    }

    try {
      const renderResult = await window.takeScreenshot()
      const renderDurationSeconds = new Date().getTime() - loadDone
      return { ...renderResult, loadDurationSeconds, renderDurationSeconds }
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error('Unknown error in preview generation while loading the object')
      return {
        reason: err.message,
        screenshots: {},
        loadDurationSeconds,
        renderDurationSeconds: new Date().getTime() - loadDone,
        durationSeconds: new Date().getTime() - start
      }
    }
    // ====================
    // The code above runs in the browser context
    // ====================
  }, job)

  if (previewResult.reason) {
    return {
      jobId: job.jobId,
      status: 'error',
      reason: previewResult.reason,
      result: previewResult
    }
  }

  return { jobId: job.jobId, status: 'success', result: previewResult }
}
