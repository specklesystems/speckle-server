'use strict'

const {
  initPrometheusMetrics,
  metricDuration,
  metricInputFileSize,
  metricOperationErrors
} = require('./prometheusMetrics')
const getDbClients = require('../knex')

const { downloadFile } = require('./filesApi')
const fs = require('fs')
const { spawn } = require('child_process')

const ServerAPI = require('../ifc/api')
const objDependencies = require('./objDependencies')
const { logger } = require('../observability/logging')
const { Scopes, wait } = require('@speckle/shared')

const HEALTHCHECK_FILE_PATH = '/tmp/last_successful_query'

const TMP_INPUT_DIR = '/tmp/file_to_import'
const TMP_FILE_PATH = '/tmp/file_to_import/file'
const TMP_RESULTS_PATH = '/tmp/import_result.json'

let shouldExit = false

let TIME_LIMIT = 10 * 60 * 1000

const providedTimeLimit = parseInt(process.env.FILE_IMPORT_TIME_LIMIT_MIN)
if (providedTimeLimit) TIME_LIMIT = providedTimeLimit * 60 * 1000

async function startTask(knex) {
  const { rows } = await knex.raw(`
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
  `)
  return rows[0]
}

async function doTask(mainDb, regionName, taskDb, task) {
  const taskId = task.id

  // Mark task as started
  await mainDb.raw(`NOTIFY file_import_started, '${task.id}'`)

  let taskLogger = logger.child({ taskId })
  let tempUserToken = null
  let mainServerApi = null
  let taskServerApi = null
  let fileTypeForMetric = 'unknown'
  let fileSizeForMetric = 0

  const metricDurationEnd = metricDuration.startTimer()
  let newBranchCreated = false
  let branchMetadata = { streamId: null, branchName: null }

  try {
    taskLogger.info("Doing task '{taskId}'.")
    const info = await taskDb('file_uploads').where({ id: taskId }).first()
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
      scopes: [Scopes.Streams.Write, Scopes.Streams.Read],
      lifespan: 1000000
    })
    tempUserToken = token

    await downloadFile({
      fileId: info.id,
      streamId: info.streamId,
      token,
      destination: TMP_FILE_PATH
    })

    if (info.fileType.toLowerCase() === 'ifc') {
      await runProcessWithTimeout(
        taskLogger,
        process.env['NODE_BINARY_PATH'] || 'node',
        [
          '--no-experimental-fetch',
          './ifc/import_file.js',
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
    } else if (info.fileType.toLowerCase() === 'stl') {
      await runProcessWithTimeout(
        taskLogger,
        process.env['PYTHON_BINARY_PATH'] || 'python3',
        [
          './stl/import_file.py',
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
      await objDependencies.downloadDependencies({
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
          './obj/import_file.py',
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

    const output = JSON.parse(fs.readFileSync(TMP_RESULTS_PATH))

    if (!output.success) throw new Error(output.error)

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
    taskLogger.error(err)
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
      [err.toString().substring(0, 254), task.id]
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

  if (tempUserToken) {
    await mainServerApi.revokeTokenById(tempUserToken)
  }
}

function runProcessWithTimeout(processLogger, cmd, cmdArgs, extraEnv, timeoutMs) {
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
      reject(rejectionReason)
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
        reject(`Parser exited with code ${code}`)
      }
    })
  })
}

function handleData(data, isErr, logger) {
  try {
    Buffer.isBuffer(data) && (data = data.toString())
    data.split('\n').forEach((line) => {
      if (!line) return
      try {
        JSON.parse(line) // verify if the data is already in JSON format
        process.stdout.write(line)
        process.stdout.write('\n')
      } catch {
        wrapLogLine(line, isErr, logger)
      }
    })
  } catch {
    wrapLogLine(JSON.stringify(data), isErr, logger)
  }
}

function wrapLogLine(line, isErr, logger) {
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
    const [regionName, taskDb] = dbClientsIterator.next().value
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

async function main() {
  logger.info('Starting FileUploads Service...')
  await initPrometheusMetrics()

  process.on('SIGTERM', () => {
    shouldExit = true
    logger.info('Shutting down...')
  })

  await doStuff()
  process.exit(0)
}

function* infiniteDbClientsIterator(dbClients) {
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

main()
