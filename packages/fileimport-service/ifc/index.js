const { performance } = require('perf_hooks')
const { fetch } = require('undici')
const Parser = require('./parser_v2')
const ServerAPI = require('./api.js')
const { Observability } = require('@speckle/shared')
const { logger: parentLogger } = require('../observability/logging')

async function parseAndCreateCommit({
  data,
  streamId,
  branchName = 'uploads',
  userId,
  message = 'Manual IFC file upload',
  fileId,
  logger
}) {
  if (!logger) {
    logger = Observability.extendLoggerComponent(
      parentLogger.child({ streamId, branchName, userId, fileId }),
      'ifc'
    )
  }
  const serverApi = new ServerAPI({ streamId, logger })
  const myParser = new Parser({ serverApi, fileId, logger })

  const start = performance.now()
  const { id, tCount } = await myParser.parse(data)
  const end = performance.now()
  logger.info(`Total processing time V2: ${(end - start).toFixed(2)}ms`)

  const commit = {
    streamId,
    branchName,
    objectId: id,
    message,
    sourceApplication: 'IFC',
    totalChildrenCount: tCount
  }

  const branch = await serverApi.getBranchByNameAndStreamId({
    streamId,
    name: branchName
  })

  if (!branch) {
    logger.info('Branch not found, creating it.')
    await serverApi.createBranch({
      name: branchName,
      streamId,
      description: branchName === 'uploads' ? 'File upload branch' : null,
      authorId: userId
    })
  }

  const userToken = process.env.USER_TOKEN

  const serverBaseUrl = process.env.SPECKLE_SERVER_URL || 'http://127.0.0.1:3000'
  logger.info(`Creating commit for object (${id}), with message "${message}"`)
  const response = await fetch(serverBaseUrl + '/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      query:
        'mutation createCommit( $myCommitInput: CommitCreateInput!) { commitCreate( commit: $myCommitInput ) }',
      variables: {
        myCommitInput: commit
      }
    })
  })

  const json = await response.json()
  logger.info(json)

  return json.data.commitCreate
}

module.exports = { parseAndCreateCommit }
