import { Page, Browser } from 'puppeteer'
import z from 'zod'
import {
  PreviewGenerator,
  PreviewResult
} from '@speckle/shared/dist/esm/previews/interface.js'
import { Logger } from 'pino'

declare global {
  interface Window extends PreviewGenerator {}
}

type JobSuccess = {
  jobId: string
  status: 'success'
  result: PreviewResult
}

type JobError = {
  jobId: string
  status: 'error'
  reason: Error
}

type JobResult = JobSuccess | JobError

export const jobPayload = z.object({
  jobId: z.string(),
  url: z.string(),
  token: z.string()
})
type JobPayload = z.infer<typeof jobPayload>

export const jobProcessor = async (
  jobLogger: Logger,
  browser: Browser,
  payload: JobPayload
): Promise<JobResult> => {
  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()
    page.on('error', (err) => {
      jobLogger.error(err, 'Page crashed')
      throw err
    })
    await page.goto('http://127.0.0.1:3010/index.html')
    // page.setDefaultTimeout(deps.timeoutMilliseconds)

    const previewResult = await page.evaluate(async (payload: JobPayload) => {
      await window.load(payload)
      return await window.takeScreenshot()
    }, payload)

    return { jobId: payload.jobId, status: 'success', result: previewResult }
  } catch (err) {
    jobLogger.error({ err }, 'Failed to process job')
    return {
      jobId: payload.jobId,
      status: 'error',
      reason:
        err instanceof Error
          ? err
          : err instanceof Object
          ? new Error(err.toString())
          : new Error('unknown error')
    }
  } finally {
    await page?.close()
  }
}
