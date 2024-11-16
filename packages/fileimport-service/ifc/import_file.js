const fs = require('fs')
const { logger: parentLogger } = require('../observability/logging')

const TMP_RESULTS_PATH = '/tmp/import_result.json'

const { parseAndCreateCommitFactory } = require('./index')
const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')
const getDbClients = require('../knex')

async function main() {
  const cmdArgs = process.argv.slice(2)

  const [filePath, userId, streamId, branchName, commitMessage, fileId, regionName] =
    cmdArgs
  const logger = Observability.extendLoggerComponent(
    parentLogger.child({ streamId, branchName, userId, fileId, filePath }),
    'ifc'
  )

  logger.info('ARGV: ', filePath, userId, streamId, branchName, commitMessage)

  const data = fs.readFileSync(filePath)

  const ifcInput = {
    data,
    streamId,
    userId,
    message: commitMessage || ' Imported file',
    fileId,
    logger
  }
  if (branchName) ifcInput.branchName = branchName

  let output = {
    success: false,
    error: 'Unknown error'
  }

  const dbClients = await getDbClients()
  const knex = dbClients[regionName].public
  try {
    const commitId = await parseAndCreateCommitFactory({ db: knex })(ifcInput)
    output = {
      success: true,
      commitId
    }
  } catch (err) {
    logger.error(err, 'Error while parsing IFC file or creating commit.')
    output = {
      success: false,
      error: err.toString()
    }
  }

  fs.writeFileSync(TMP_RESULTS_PATH, JSON.stringify(output))

  process.exit(0)
}

main()
