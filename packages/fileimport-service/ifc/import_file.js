const fs = require('fs')
const { logger } = require('../observability/logging')

const TMP_RESULTS_PATH = '/tmp/import_result.json'

const { parseAndCreateCommit } = require('./index')

async function main() {
  const cmdArgs = process.argv.slice(2)

  const [filePath, userId, streamId, branchName, commitMessage, fileId] = cmdArgs

  // eslint-disable-next-line no-console
  logger.info('ARGV: ', filePath, userId, streamId, branchName, commitMessage)

  const data = fs.readFileSync(filePath)

  const ifcInput = {
    data,
    streamId,
    userId,
    message: commitMessage || ' Imported file',
    fileId
  }
  if (branchName) ifcInput.branchName = branchName

  let output = {
    success: false,
    error: 'Unknown error'
  }

  try {
    const commitId = await parseAndCreateCommit(ifcInput)
    output = {
      success: true,
      commitId
    }
  } catch (err) {
    console.log(err)
    output = {
      success: false,
      error: err.toString()
    }
  }

  fs.writeFileSync(TMP_RESULTS_PATH, JSON.stringify(output))

  process.exit(0)
}

main()
