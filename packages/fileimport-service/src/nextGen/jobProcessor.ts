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
import { TIME_MS } from '@speckle/shared'

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

  let parserUsed = 'none'

  const tmp = tmpdir()
  const jobDir = path.join(tmp, job.jobId)
  let downloadDurationSeconds = 0
  let parseDurationSeconds = 0

  fs.rmSync(jobDir, { force: true, recursive: true })
  fs.mkdirSync(jobDir)
  const fileType = job.fileType.toLowerCase()
  const sourceFilePath = path.join(jobDir, job.fileName)
  const resultsPath = path.join(jobDir, 'import_results.json')

  const elapsedDownloadDuration = (() => {
    const start = new Date().getTime()
    return () => (new Date().getTime() - start) / TIME_MS.second
  })()

  try {
    await downloadFile({
      speckleServerUrl: job.serverUrl,
      fileId: job.blobId,
      streamId: job.projectId,
      token: job.token,
      destination: sourceFilePath,
      logger
    })

    downloadDurationSeconds = elapsedDownloadDuration()
  } catch (err) {
    if (!downloadDurationSeconds) downloadDurationSeconds = elapsedDownloadDuration()

    if (getAppState() === AppState.SHUTTINGDOWN) {
      // likely that the job was cancelled due to the service shutting down
      logger.warn(
        { err, jobId: job.jobId, elapsed: getElapsed(), status: 'error' },
        jobMessage
      )
    } else {
      logger.error(
        { err, jobId: job.jobId, elapsed: getElapsed(), status: 'error' },
        jobMessage
      )
    }

    const reason =
      err instanceof Error
        ? err.stack ?? err.toString()
        : 'unknown error while downloading file'

    try {
      // try and clean up the job directory
      fs.rmSync(jobDir, { recursive: true })
    } finally {
      // return the error result whether or not the cleanup succeeded
      return {
        status: 'error',
        result: {
          parser: parserUsed,
          durationSeconds: getElapsed(),
          downloadDurationSeconds,
          parseDurationSeconds
        },
        reason
      }
    }
  }

  const elapsedParseDuration = (() => {
    const start = new Date().getTime()
    return () => (new Date().getTime() - start) / TIME_MS.second
  })()

  try {
    switch (fileType) {
      case 'ifc':
        parserUsed = 'ifc'
        const useDotnetIfcImporter = job.fileName
          .toLowerCase()
          .endsWith('.dotnetimporter.ifc')

        if (useDotnetIfcImporter) {
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
              SPECKLE_SERVER_URL: job.serverUrl,
              USER_TOKEN: job.token
            },
            Math.min(timeout, job.timeOutSeconds * TIME_MS.second),
            resultsPath
          )
        } else {
          await runProcessWithTimeout(
            taskLogger,
            process.env['PYTHON_BINARY_PATH'] || 'python3',
            [
              '-m',
              'speckleifc',
              sourceFilePath,
              resultsPath,
              job.projectId,
              `File upload: ${job.fileName}`,
              job.modelId
            ],
            {
              USER_TOKEN: job.token,
              SPECKLE_SERVER_URL: job.serverUrl,
              //speckleifc is not installed to sys (e.g. via pip), so we need to point it to the directory explicitly
              PYTHONPATH: '/speckle-server/speckleifc/src/'
            },
            Math.min(timeout, job.timeOutSeconds * TIME_MS.second),
            resultsPath
          )
        }

        break
      case 'stl':
      case 'obj':
      case 'skp':
        parserUsed = 'rhino'
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
            SPECKLE_SERVER_URL: job.serverUrl,
            USER_TOKEN: job.token
          },
          Math.min(timeout, job.timeOutSeconds * TIME_MS.second),
          resultsPath
        )
        break
      default:
        throw new Error(`File type ${fileType} is not supported`)
    }

    parseDurationSeconds = elapsedParseDuration()

    const output = jobResult.safeParse(JSON.parse(readFileSync(resultsPath, 'utf8')))

    if (!output.success) {
      throw new Error('could not parse the result file')
    }

    if (!output.data.success) {
      throw new Error(output.data.error)
    }

    const versionId = output.data.commitId
    return {
      status: 'success',
      result: {
        versionId,
        durationSeconds: getElapsed(),
        downloadDurationSeconds,
        parseDurationSeconds,
        parser: parserUsed
      },
      warnings: []
    }
  } catch (err) {
    if (!parseDurationSeconds) parseDurationSeconds = elapsedParseDuration()

    if (getAppState() === AppState.SHUTTINGDOWN) {
      // likely that the job was cancelled due to the service shutting down
      logger.warn(
        { err, jobId: job.jobId, elapsed: getElapsed(), status: 'error' },
        jobMessage
      )
    } else {
      logger.error(
        { err, jobId: job.jobId, elapsed: getElapsed(), status: 'error' },
        jobMessage
      )
    }

    const reason =
      err instanceof Error
        ? err.stack ?? err.toString()
        : 'unknown error while parsing file'

    return {
      status: 'error',
      result: {
        parser: parserUsed,
        durationSeconds: getElapsed(),
        downloadDurationSeconds,
        parseDurationSeconds
      },
      reason
    }
  } finally {
    fs.rmSync(jobDir, { recursive: true })
  }
}
