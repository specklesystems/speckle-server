import { Page, Browser, type ConsoleMessage } from 'puppeteer'
import type { Logger } from 'pino'

import type {
  PreviewGenerator,
  JobPayload,
  PreviewResultPayload
} from '@speckle/shared/workers/previews'
import { AppState } from '@speckle/shared/workers'
import { TIME_MS } from '@speckle/shared'

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
  getAppState: () => AppState
}

type PageArgs = SharedArgs & {
  page: Page
}

const serializeConsoleMessage = (msg: ConsoleMessage): Record<string, unknown> => {
  return {
    type: msg.type(),
    text: msg.text(),
    args: msg.args(),
    stackTrace: msg.stackTrace(),
    location: msg.location()
  }
}

export const jobProcessor = async ({
  logger,
  browser,
  job,
  port,
  timeout,
  getAppState
}: JobArgs): Promise<PreviewResultPayload> => {
  const elapsed = (() => {
    const start = new Date().getTime()
    return () => (new Date().getTime() - start) / TIME_MS.second
  })()

  logger.info('Picked up job {jobId} for {serverUrl}')

  const jobMessage =
    'Processed job {jobId} with result {status}. It took {elapsed} seconds.'
  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()

    const result = await pageFunction({ page, job, logger, port, timeout })
    logger.info({ status: result.status, elapsed: elapsed() }, jobMessage)
    return result
  } catch (err: unknown) {
    if (getAppState() === AppState.SHUTTINGDOWN) {
      // likely that the job was cancelled due to the service shutting down
      logger.warn({ err, elapsed: elapsed(), status: 'error' }, jobMessage)
    } else {
      logger.error({ err, elapsed: elapsed(), status: 'error' }, jobMessage)
    }

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
        durationSeconds: elapsed()
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
  page.on('console', (msg) => {
    switch (msg.type()) {
      case 'debug':
        logger.debug(msg.text())
      case 'error':
        logger.warn({ err: serializeConsoleMessage(msg) }, 'Page error')
        break
      case 'warn':
        logger.info({ err: serializeConsoleMessage(msg) }, msg.text())
        break
      default:
        logger.debug({ msg: serializeConsoleMessage(msg) }, msg.text())
        break
    }
  })
  await page.goto(`http://127.0.0.1:${port}/index.html`)
  page.setDefaultTimeout(timeout)
  const previewResult = await page.evaluate(async (job: JobPayload) => {
    // ====================
    // This code runs in the browser context and has no access to the outer scope.
    // Puppeteer and window are available here, but @speckle/shared is not.
    // ====================
    const start = new Date().getTime()
    let loadDone = start
    let loadDurationSeconds = 0
    try {
      await window.load(job)
      loadDone = new Date().getTime()
      loadDurationSeconds = (loadDone - start) / 1000
      console.log(`Loading completed in ${loadDurationSeconds} seconds`)
    } catch (e) {
      const loadErrored = new Date().getTime()
      const err =
        e instanceof Error
          ? e
          : new Error('Unknown error in preview generation while loading the object')

      return {
        reason: err.message,
        screenshots: {},
        loadDurationSeconds: (loadErrored - start) / 1000,
        durationSeconds: (loadErrored - start) / 1000
      }
    }

    try {
      const renderResult = await window.takeScreenshot()
      const renderDurationSeconds = (new Date().getTime() - loadDone) / 1000
      console.log(`Render completed in ${renderDurationSeconds} seconds`)
      return { ...renderResult, loadDurationSeconds, renderDurationSeconds }
    } catch (e) {
      const loadErrored = new Date().getTime()
      const err =
        e instanceof Error
          ? e
          : new Error('Unknown error in preview generation while loading the object')
      return {
        reason: err.message,
        screenshots: {},
        loadDurationSeconds,
        renderDurationSeconds: (loadErrored - loadDone) / 1000,
        durationSeconds: (loadErrored - start) / 1000
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
