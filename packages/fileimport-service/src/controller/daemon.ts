import {
  initPrometheusMetrics,
  metricDuration,
  metricInputFileSize,
  metricOperationErrors
} from '@/controller/prometheusMetrics.js'
import { DbClient, getDbClients } from '@/clients/knex.js'
import { downloadFile } from '@/controller/filesApi.js'
import fs from 'fs'
import { ServerAPI } from '@/controller/api.js'
import { downloadDependencies } from '@/controller/objDependencies.js'
import { logger } from '@/observability/logging.js'
import { Nullable, Scopes, wait, TIME_MS } from '@speckle/shared'
import { Knex } from 'knex'
import { getIfcDllPath, isProdEnv } from '@/controller/helpers/env.js'
import { isErrorOutput, isSuccessOutput } from '@/common/output.js'
import { runProcessWithTimeout } from '@/common/processHandling.js'
import {
  getConnectionSettings,
  obfuscateConnectionString
} from '@speckle/shared/environment/db'

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

const TMP_INPUT_DIR = '/tmp/file_to_import'
const TMP_FILE_PATH = '/tmp/file_to_import/file'
const TMP_RESULTS_PATH = '/tmp/import_result.json'

let shouldExit = false

let TIME_LIMIT = 10 * TIME_MS.minute

const providedTimeLimit = parseInt(process.env['FILE_IMPORT_TIME_LIMIT_MIN'] || '10')
if (providedTimeLimit) TIME_LIMIT = providedTimeLimit * TIME_MS.minute

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
    RETURNING file_uploads."id", file_uploads."streamId"
  `)) satisfies { rows: { id: string; streamId: string }[] }
  return rows[0]
}

async function doTask(
  mainDbs: DbClient,
  regionName: string,
  taskDb: Knex,
  task: { id: string; streamId: string }
) {
  const mainDb = mainDbs.public

  // In local envs these URIs can be docker-compatible only, and can break local envs
  const mainDbPrivate = isProdEnv() && mainDbs.private ? mainDbs.private : mainDb

  const taskId = task.id
  let taskLogger = logger.child({ taskId })

  // TODO: Troubleshooting listen/notify issues
  const connectionSettings = getConnectionSettings(mainDbPrivate)
  const mainDbConnectionString = obfuscateConnectionString(
    connectionSettings.connectionString || ''
  )

  // Mark task as started
  await mainDbPrivate.raw(
    `NOTIFY file_import_started, '${task.id}:::${task.streamId}::::::'`
  )
  taskLogger.info(
    {
      mainDbConnectionString
    },
    'Notified file_import_started...'
  )

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
      lifespan: TIME_LIMIT + 5 * TIME_MS.minute // plus 5 minutes buffer to download the file and other overhead
    })
    tempUserToken = token

    taskLogger.info('Downloading file {fileId}')

    const speckleServerUrl = process.env.SPECKLE_SERVER_URL || 'http://127.0.0.1:3000'

    await downloadFile({
      speckleServerUrl,
      fileId: info.id,
      streamId: info.streamId,
      token,
      destination: TMP_FILE_PATH,
      logger: taskLogger
    })

    taskLogger.info('Triggering importer for {fileType}')

    if (info.fileType.toLowerCase() === 'ifc') {
      if (info.fileName.toLowerCase().endsWith('.legacyimporter.ifc')) {
        await runProcessWithTimeout(
          taskLogger,
          process.env['NODE_BINARY_PATH'] || 'node',
          [
            '--no-experimental-fetch',
            '--loader=./dist/src/aliasLoader.js',
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
          TIME_LIMIT,
          TMP_RESULTS_PATH
        )
      } else if (info.fileName.toLowerCase().endsWith('.dotnetimporter.ifc')) {
        await runProcessWithTimeout(
          taskLogger,
          process.env['DOTNET_BINARY_PATH'] || 'dotnet',
          [
            getIfcDllPath(),
            TMP_FILE_PATH,
            TMP_RESULTS_PATH,
            info.streamId,
            `File upload: ${info.fileName}`,
            existingBranch?.id || '',
            info.branchName,
            regionName
          ],
          {
            USER_TOKEN: tempUserToken
          },
          TIME_LIMIT,
          TMP_RESULTS_PATH
        )
      } else {
        await runProcessWithTimeout(
          taskLogger,
          process.env['PYTHON_BINARY_PATH'] || 'python3',
          [
            '-m',
            'speckleifc',
            TMP_FILE_PATH,
            TMP_RESULTS_PATH,
            info.streamId,
            `File upload: ${info.fileName}`,
            existingBranch?.id || ''
          ],
          {
            USER_TOKEN: tempUserToken,
            //speckleifc is not installed to sys (e.g. via pip), so we need to point it to the directory explicitly
            PYTHONPATH: '/speckle-server/speckleifc/src/'
          },
          TIME_LIMIT,
          TMP_RESULTS_PATH
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
        TIME_LIMIT,
        TMP_RESULTS_PATH
      )
    } else if (info.fileType.toLowerCase() === 'obj') {
      await downloadDependencies({
        speckleServerUrl,
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
        TIME_LIMIT,
        TMP_RESULTS_PATH
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
    await mainDbPrivate.raw(
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

const doStuff = async () => {
  const dbClients = await getDbClients()
  const dbClientsIterator = infiniteDbClientsIterator(dbClients)
  while (!shouldExit) {
    const [regionName, taskDb]: [string, Knex] = dbClientsIterator.next().value
    try {
      const task = await startTask(taskDb)
      fs.writeFile(HEALTHCHECK_FILE_PATH, '' + Date.now(), () => {})
      if (!task) {
        await wait(1 * TIME_MS.second)
        continue
      }
      await doTask(dbClients.main, regionName, taskDb, task)
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
