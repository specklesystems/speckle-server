import Environment from '@speckle/shared/dist/commonjs/environment/index.js'
import {
  initPrometheusMetrics,
  metricDuration,
  metricInputFileSize,
  metricOperationErrors
} from '@/controller/prometheusMetrics.js'
import { getDbClients } from '@/knex.js'

import { downloadFile } from '@/controller/filesApi.js'
import fs from 'fs'
import { spawn } from 'child_process'

import { ServerAPI } from '@/controller/api.js'
import { downloadDependencies } from '@/controller/objDependencies.js'
import { logger } from '@/observability/logging.js'
import { Nullable, Scopes, wait } from '@speckle/shared'
import { Knex } from 'knex'
import { Logger } from 'pino'

const { FF_FILEIMPORT_IFC_DOTNET_ENABLED } = Environment.getFeatureFlags()

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

const TMP_INPUT_DIR = '/tmp/file_to_import'
const TMP_FILE_PATH = '/tmp/file_to_import/file'
const TMP_RESULTS_PATH = '/tmp/import_result.json'

let shouldExit = false

let TIME_LIMIT = 10 * 60 * 1000

const providedTimeLimit = parseInt(process.env['FILE_IMPORT_TIME_LIMIT_MIN'] || '10')
if (providedTimeLimit) TIME_LIMIT = providedTimeLimit * 60 * 1000

async function startTask(knex: Knex) {
  const { rows } = (await knex.raw(`
    UPDATE file_uploads
    SET
      "convertedStatus" = 1,
      "convertedLastUpdate" = NOW()
    FROM (
      SELECT "id" FROM file_uploads
      WHERE "convertedStatus" = 0 AND "uploadComplete" = 't'
      ORDER BY "convertedLastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE file_uploads."id" = task."id"
    RETURNING file_uploads."id"
  `)) satisfies { rows: { id: string }[] }
  return rows[0]
}

async function doTask(
  mainDb: Knex,
  regionName: string,
  taskDb: Knex,
  task: { id: string }
) {
  const taskId = task.id

  // Mark task as started
  await mainDb.raw(`NOTIFY file_import_started, '${task.id}'`)

  let taskLogger = logger.child({ taskId })
  let tempUserToken: Nullable<string> = null
  let mainServerApi = null
  let taskServerApi = null
  let fileTypeForMetric = 'unknown'
  let fileSizeForMetric = 0

  const metricDurationEnd = metricDuration.startTimer()
  let newBranchCreated = false
  let branchMetadata: { streamId: Nullable<string>; branchName: Nullable<string> } = {
    streamId: null,
    branchName: null
  }

  try {
    taskLogger.info("Doing task '{taskId}'.")
    const info = await taskDb<{
      id: string
      fileType: string
      fileSize: string
      fileName: string
      userId: string
      streamId: string
      branchName: string
    }>('file_uploads')
      .where({ id: taskId })
      .first()
    if (!info) {
      throw new Error('Internal error: DB inconsistent')
    }

    fileTypeForMetric = info.fileType || 'missing_info'
    fileSizeForMetric = Number(info.fileSize) || 0
    taskLogger = taskLogger.child({
      fileId: info.id,
      fileType: fileTypeForMetric,
      fileName: info.fileName,
      fileSize: fileSizeForMetric,
      userId: info.userId,
      projectId: info.streamId,
      modelName: info.branchName
    })
    fs.mkdirSync(TMP_INPUT_DIR, { recursive: true })

    mainServerApi = new ServerAPI({
      db: mainDb,
      streamId: info.streamId,
      logger: taskLogger
    })
    taskServerApi = new ServerAPI({
      db: taskDb,
      streamId: info.streamId,
      logger: taskLogger
    })

    branchMetadata = {
      branchName: info.branchName,
      streamId: info.streamId
    }
    const existingBranch = await taskServerApi.getBranchByNameAndStreamId({
      streamId: info.streamId,
      name: info.branchName
    })
    if (!existingBranch) {
      newBranchCreated = true
    }
    taskLogger = taskLogger.child({
      modelId: existingBranch?.id
    })

    const { token } = await mainServerApi.createToken({
      userId: info.userId,
      name: 'temp upload token',
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read, Scopes.Profile.Read],
      lifespan: 1000000
    })
    tempUserToken = token

    taskLogger.info('Downloading file {fileId}')

    await downloadFile({
      fileId: info.id,
      streamId: info.streamId,
      token,
      destination: TMP_FILE_PATH
    })

    taskLogger.info('Triggering importer for {fileType}')

    if (info.fileType.toLowerCase() === 'ifc') {
      if (FF_FILEIMPORT_IFC_DOTNET_ENABLED) {
        await runProcessWithTimeout(
          taskLogger,
          process.env['DOTNET_BINARY_PATH'] || 'dotnet',
          [
            process.env['IFC_DOTNET_DLL_PATH'] ||
              '/speckle-server/packages/fileimport-service/src/ifc-dotnet/ifc-converter.dll',
            TMP_FILE_PATH,
            TMP_RESULTS_PATH,
            info.streamId,
            `File upload: ${info.fileName}`,
            existingBranch?.id || '',
            regionName
          ],
          {
            USER_TOKEN: tempUserToken
          },
          TIME_LIMIT
        )
      } else {
        await runProcessWithTimeout(
          taskLogger,
          process.env['NODE_BINARY_PATH'] || 'node',
          [
            '--no-experimental-fetch',
            './src/ifc/import_file.js',
            TMP_FILE_PATH,
            TMP_RESULTS_PATH,
            info.userId,
            info.streamId,
            info.branchName,
            `File upload: ${info.fileName}`,
            info.id,
            existingBranch?.id || '',
            regionName
          ],
          {
            USER_TOKEN: tempUserToken
          },
          TIME_LIMIT
        )
      }
    } else if (info.fileType.toLowerCase() === 'stl') {
      await runProcessWithTimeout(
        taskLogger,
        process.env['PYTHON_BINARY_PATH'] || 'python3',
        [
          './src/stl/import_file.py',
          TMP_FILE_PATH,
          TMP_RESULTS_PATH,
          info.userId,
          info.streamId,
          info.branchName,
          `File upload: ${info.fileName}`,
          info.id,
          existingBranch?.id || '',
          regionName
        ],
        {
          USER_TOKEN: tempUserToken
        },
        TIME_LIMIT
      )
    } else if (info.fileType.toLowerCase() === 'obj') {
      await downloadDependencies({
        objFilePath: TMP_FILE_PATH,
        streamId: info.streamId,
        destinationDir: TMP_INPUT_DIR,
        token: tempUserToken
      })

      await runProcessWithTimeout(
        taskLogger,
        process.env['PYTHON_BINARY_PATH'] || 'python3',
        [
          '-u',
          './src/obj/import_file.py',
          TMP_FILE_PATH,
          TMP_RESULTS_PATH,
          info.userId,
          info.streamId,
          info.branchName,
          `File upload: ${info.fileName}`,
          info.id,
          existingBranch?.id || '',
          regionName
        ],
        {
          USER_TOKEN: tempUserToken
        },
        TIME_LIMIT
      )
    } else {
      throw new Error(`File type ${info.fileType} is not supported`)
    }

    const output: unknown = JSON.parse(fs.readFileSync(TMP_RESULTS_PATH, 'utf8'))

    if (!isSuccessOutput(output)) {
      throw new Error(isErrorOutput(output) ? output.error : 'Unknown error')
    }

    const commitId = output.commitId

    await taskDb.raw(
      `
      UPDATE file_uploads
      SET
        "convertedStatus" = 2,
        "convertedLastUpdate" = NOW(),
        "convertedMessage" = 'File converted successfully',
        "convertedCommitId" = ?
      WHERE "id" = ?
    `,
      [commitId, task.id]
    )
  } catch (err) {
    taskLogger.error(err, 'Error processing task')
    const errorForDatabase = maybeErrorToString(err)
    await taskDb.raw(
      `
      UPDATE file_uploads
      SET
        "convertedStatus" = 3,
        "convertedLastUpdate" = NOW(),
        "convertedMessage" = ?
      WHERE "id" = ?
    `,
      // DB only accepts a varchar 255
      [errorForDatabase.substring(0, 254), task.id]
    )
    metricOperationErrors.labels(fileTypeForMetric).inc()
  } finally {
    const { streamId, branchName } = branchMetadata
    await mainDb.raw(
      `NOTIFY file_import_update, '${task.id}:::${streamId}:::${branchName}:::${
        newBranchCreated ? 1 : 0
      }'`
    )
  }
  metricDurationEnd({ op: fileTypeForMetric })
  metricInputFileSize.labels(fileTypeForMetric).observe(fileSizeForMetric)

  fs.rmSync(TMP_INPUT_DIR, { force: true, recursive: true })
  if (fs.existsSync(TMP_RESULTS_PATH)) fs.unlinkSync(TMP_RESULTS_PATH)

  if (mainServerApi && tempUserToken) {
    await mainServerApi.revokeTokenById(tempUserToken)
  }
}

function maybeErrorToString(error: unknown): string {
  const unknownError = 'Unknown error'
  if (!error) return unknownError
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return unknownError
  }
}

function isSuccessOutput(
  maybeSuccessOutput: unknown
): maybeSuccessOutput is { success: true; commitId: string } {
  return (
    !!maybeSuccessOutput &&
    typeof maybeSuccessOutput === 'object' &&
    'success' in maybeSuccessOutput &&
    typeof maybeSuccessOutput.success === 'boolean' &&
    maybeSuccessOutput.success &&
    'commitId' in maybeSuccessOutput &&
    typeof maybeSuccessOutput.commitId === 'string'
  )
}

function isErrorOutput(
  maybeErrorOutput: unknown
): maybeErrorOutput is { success: false; error: string } {
  return (
    !!maybeErrorOutput &&
    typeof maybeErrorOutput === 'object' &&
    'error' in maybeErrorOutput &&
    typeof maybeErrorOutput.error === 'string' &&
    !!maybeErrorOutput.error
  )
}

function runProcessWithTimeout(
  processLogger: Logger,
  cmd: string,
  cmdArgs: string[],
  extraEnv: Record<string, string>,
  timeoutMs: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    let boundLogger = processLogger.child({ cmd, args: cmdArgs })
    boundLogger.info('Starting process.')
    const childProc = spawn(cmd, cmdArgs, { env: { ...process.env, ...extraEnv } })

    boundLogger = boundLogger.child({ pid: childProc.pid })
    childProc.stdout.on('data', (data) => {
      handleData(data, false, boundLogger)
    })

    childProc.stderr.on('data', (data) => {
      handleData(data, true, boundLogger)
    })

    let timedOut = false

    const timeout = setTimeout(() => {
      boundLogger.warn('Process timed out. Killing process...')

      timedOut = true
      childProc.kill(9)
      const rejectionReason = `Timeout: Process took longer than ${timeoutMs} milliseconds to execute.`
      const output = {
        success: false,
        error: rejectionReason
      }
      fs.writeFileSync(TMP_RESULTS_PATH, JSON.stringify(output))
      reject(new Error(rejectionReason))
    }, timeoutMs)

    childProc.on('close', (code) => {
      boundLogger.info({ exitCode: code }, "Process exited with code '{exitCode}'")

      if (timedOut) {
        return // ignore `close` calls after killing (the promise was already rejected)
      }

      clearTimeout(timeout)

      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Parser exited with code ${code}`))
      }
    })
  })
}

function handleData(data: unknown, isErr: boolean, logger: Logger) {
  try {
    if (!Buffer.isBuffer(data)) return
    const dataAsString = data.toString()
    dataAsString.split('\n').forEach((line) => {
      if (!line) return
      try {
        JSON.parse(line) // verify if the data is already in JSON format
        process.stdout.write('\n')
      } catch {
        wrapLogLine(line, isErr, logger)
      }
    })
  } catch {
    wrapLogLine(JSON.stringify(data), isErr, logger)
  }
}

function wrapLogLine(line: string, isErr: boolean, logger: Logger) {
  if (isErr) {
    logger.error({ parserLogLine: line }, 'ParserLog: {parserLogLine}')
    return
  }
  logger.info({ parserLogLine: line }, 'ParserLog: {parserLogLine}')
}

const doStuff = async () => {
  const dbClients = await getDbClients()
  const mainDb = dbClients.main.public
  const dbClientsIterator = infiniteDbClientsIterator(dbClients)
  while (!shouldExit) {
    const [regionName, taskDb]: [string, Knex] = dbClientsIterator.next().value
    try {
      const task = await startTask(taskDb)
      fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})
      if (!task) {
        await wait(1000)
        continue
      }
      await doTask(mainDb, regionName, taskDb, task)
      await wait(10)
    } catch (err) {
      metricOperationErrors.labels('main_loop').inc()
      logger.error(err, 'Error executing task')
      await wait(5000)
    }
  }
}

export async function main() {
  logger.info('Starting FileUploads Service...')
  await initPrometheusMetrics()

  process.on('SIGTERM', () => {
    shouldExit = true
    logger.info('Shutting down...')
  })

  await doStuff()
  process.exit(0)
}

function* infiniteDbClientsIterator(dbClients: {
  [key: string]: { public: Knex }
}): Generator<[string, Knex], [string, Knex], [string, Knex]> {
  let index = 0
  const dbClientEntries = [...Object.entries(dbClients)]
  const clientCount = dbClientEntries.length
  while (true) {
    // reset index
    if (index === clientCount) index = 0
    const [regionName, dbConnection] = dbClientEntries[index]
    index++
    yield [regionName, dbConnection.public]
  }
}
