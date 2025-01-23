const fs = require('fs')
const { logger: parentLogger } = require('../observability/logging')

const { parseAndCreateCommitFactory } = require('./index')
const Observability = require('@speckle/shared/dist/commonjs/observability/index.js')
const getDbClients = require('../knex')

async function main() {
  const cmdArgs = process.argv.slice(2)

  const [
    filePath,
    tmpResultsPath,
    userId,
    streamId,
    branchName,
    commitMessage,
    fileId,
    branchId,
    regionName
  ] = cmdArgs
  const logger = Observability.extendLoggerComponent(
    parentLogger.child({ streamId, branchName, userId, fileId, branchId, filePath }),
    'ifc'
  )

  logger.info({ commitMessage }, 'IFC parser started.')

  const data = fs.readFileSync(filePath)

  const ifcInput = {
    data,
    streamId,
    userId,
    message: commitMessage || ' Imported file',
    fileId,
    branchId,
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

  fs.writeFileSync(tmpResultsPath, JSON.stringify(output))

  process.exit(0)
}

main()
