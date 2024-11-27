import { Page, Browser } from 'puppeteer'
import z from 'zod'
import {
  PreviewGenerator,
  PreviewResult
} from '@speckle/shared/dist/esm/previews/interface.js'

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
  browser: Browser,
  payload: JobPayload
): Promise<JobResult> => {
  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()
    page.on('error', (err) => {
      console.log('Page crashed', err)
      throw err
    })
    await page.goto('http://127.0.0.1:3010/index.html')
    // page.setDefaultTimeout(deps.timeoutMilliseconds)

    const previewResult = await page.evaluate(async (payload: JobPayload) => {
      await window.load(payload)
      return await window.takeScreenshot()
    }, payload)

    // await resultsQueue.add({
    //   jobId: payload.jobId,
    //   status: 'success',
    //   result: evaluationResult,
    // })
    console.log('done with job')
    return { jobId: payload.jobId, status: 'success', result: previewResult }
  } catch (err) {
    console.log(err)
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
