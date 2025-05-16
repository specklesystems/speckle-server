import { downloadFile } from '@/controller/filesApi.js'
import { AppState } from '@speckle/shared/workers'
import { JobPayload, FileImportResultPayload } from '@speckle/shared/workers/fileimport'
import { Logger } from 'pino'
import { tmpdir } from 'node:os'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import fs from 'fs'
import { runProcessWithTimeout } from '@/common/processHandling.js'
import { DOTNET_BINARY_PATH, RHINO_IMPORTER_PATH } from './config.js'
import { getIfcDllPath } from '@/controller/helpers/env.js'
import { z } from 'zod'

const jobSuccess = z.object({
  success: z.literal(true),
  commitId: z.string()
})

const jobError = z.object({
  success: z.literal(false),
  error: z.string()
})

const jobResult = z.discriminatedUnion('success', [jobSuccess, jobError])

type JobArgs = {
  job: JobPayload
  timeout: number
  logger: Logger
  getAppState: () => AppState
  getElapsed: () => number
}

export const jobProcessor = async ({
  job,
  timeout,
  logger,
  getAppState,
  getElapsed
}: JobArgs): Promise<FileImportResultPayload> => {
  const taskLogger = logger
  const jobMessage =
    'Processed job {jobId} with result {status}. It took {elapsed} seconds.'

  const tmp = tmpdir()
  const jobDir = path.join(tmp, job.jobId)
  fs.mkdirSync(jobDir)
  try {
    const fileType = job.fileType.toLowerCase()
    const sourceFilePath = path.join(jobDir, job.fileName)
    const resultsPath = path.join(jobDir, 'import_results.json')

    await downloadFile({
      speckleServerUrl: job.serverUrl,
      fileId: job.blobId,
      streamId: job.projectId,
      token: job.token,
      destination: sourceFilePath,
      logger
    })

    switch (fileType) {
      case 'ifc':
        await runProcessWithTimeout(
          taskLogger,
          DOTNET_BINARY_PATH,
          [
            getIfcDllPath(),
            sourceFilePath,
            resultsPath,
            job.projectId,
            `File upload: ${job.fileName}`,
            job.modelId,
            'bogus',
            'regionName'
          ],
          {
            USER_TOKEN: job.token
          },
          timeout,
          resultsPath
        )
        break
      case 'stl':
      case 'obj':
        await runProcessWithTimeout(
          taskLogger,
          RHINO_IMPORTER_PATH,
          [
            sourceFilePath,
            resultsPath,
            job.projectId,
            job.modelId,
            job.serverUrl,
            job.token
          ],
          {
            USER_TOKEN: job.token
          },
          timeout,
          resultsPath
        )
        break
      default:
        throw new Error(`File type ${fileType} is not supported`)
    }
    const output = jobResult.safeParse(JSON.parse(readFileSync(resultsPath, 'utf8')))

    if (!output.success) {
      throw new Error('could not parse the result file')
    }

    if (!output.data.success) {
      throw new Error(output.data.error)
    }

    const versionId = output.data.commitId
    return {
      jobId: job.jobId,
      status: 'success',
      result: { versionId, durationSeconds: getElapsed() },
      warnings: []
    }
  } catch (err) {
    if (getAppState() === AppState.SHUTTINGDOWN) {
      // likely that the job was cancelled due to the service shutting down
      logger.warn({ err, elapsed: getElapsed(), status: 'error' }, jobMessage)
    } else {
      logger.error({ err, elapsed: getElapsed(), status: 'error' }, jobMessage)
    }

    const reason = err instanceof Error ? err.stack ?? err.toString() : 'unknown error'

    return {
      jobId: job.jobId,
      status: 'error',
      result: {
        durationSeconds: getElapsed()
      },
      reason
    }
  } finally {
    fs.rmdirSync(jobDir, { recursive: true })
  }
}
