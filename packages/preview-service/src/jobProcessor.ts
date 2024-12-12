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

type Job = {
  jobId: string
}

type JobSuccess = Job & {
  status: 'success'
  result: PreviewResult
}

type JobError = Job & {
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

export const jobProcessor = async ({
  logger,
  browser,
  payload
}: {
  logger: Logger
  browser: Browser
  payload: any
}): Promise<JobResult> => {
  const parseResult = jobPayload.safeParse(payload)
  if (!parseResult.success) {
    const jobId =
      'jobId' in payload && typeof payload['jobId'] === 'string'
        ? payload['jobId']
        : 'unknown'
    logger.error({ parseError: parseResult.error }, 'Failed to parse job payload')
    return { jobId, status: 'error', reason: parseResult.error }
  }
  const job = parseResult.data
  const jobId = job.jobId
  const jobLogger = logger.child({ jobId })
  const start = new Date()
  jobLogger.info({ start }, 'Picking up job {jobId}')

  let page: Page | undefined = undefined
  try {
    page = await browser.newPage()
    const a = await Promise.race([
      pageFunction({ page, job, jobLogger }),
      new Promise((resolve, reject) => {
        setTimeout(resolve, 500, 'one')
        return
      })
    ])
    const doJob = async () => {}
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
    return {
      jobId: job.jobId,
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

const pageFunction = async ({
  page,
  job,
  jobLogger
}: {
  page: Page
  job: JobPayload
  jobLogger: Logger
}): Promise<JobSuccess> => {
  page.on('error', (err) => {
    jobLogger.error({ err }, 'Page crashed')
    throw err
  })
  await page.goto('http://127.0.0.1:3010/index.html')
  // page.setDefaultTimeout(deps.timeoutMilliseconds)

  const previewResult = await page.evaluate(async (job: JobPayload) => {
    await window.load(job)
    return await window.takeScreenshot()
  }, job)

  return { jobId: job.jobId, status: 'success', result: previewResult }
}
