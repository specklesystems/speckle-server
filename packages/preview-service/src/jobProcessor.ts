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
  const jobId = job.jobId
  const jobLogger = logger.child({ jobId, serverUrl: job.url })
  const start = new Date()
  jobLogger.info('Picked up job {jobId} for {serverUrl}')

  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()

    const result = await pageFunction({ page, job, logger: jobLogger, port, timeout })
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
  // page.setDefaultTimeout(deps.timeoutMilliseconds)
  const previewResult = await Promise.race([
    page.evaluate(async (job: JobPayload) => {
      await window.load(job)
      return await window.takeScreenshot()
    }, job),
    timeoutAt(timeout)
  ])

  return { jobId: job.jobId, status: 'success', result: previewResult }
}
