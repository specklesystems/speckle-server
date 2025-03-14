import fs from 'fs'
import { logger as parentLogger } from '../../dist/src/observability/logging.js'

import { parseAndCreateCommitFactory } from './index.js'
import Observability from '@speckle/shared/dist/commonjs/observability/index.js'
import { getDbClients } from '../../dist/src/knex.js'

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
