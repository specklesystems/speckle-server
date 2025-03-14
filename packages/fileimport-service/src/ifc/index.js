import { performance } from 'perf_hooks'
import { fetch } from 'undici'
import { IFCParser } from './parser.js'
import Observability from '@speckle/shared/dist/commonjs/observability/index.js'
import { ServerAPI } from '../../dist/src/controller/api.js'
import { logger as parentLogger } from '../../dist/src/observability/logging.js'

export const parseAndCreateCommitFactory =
  ({ db }) =>
  async ({
    data,
    streamId,
    branchName = 'uploads',
    userId,
    message = 'Manual IFC file upload',
    fileId,
    branchId,
    logger
  }) => {
    if (!logger) {
      logger = Observability.extendLoggerComponent(
        parentLogger.child({ streamId, branchName, userId, fileId }),
        'ifc'
      )
    }
    const serverApi = new ServerAPI({ db, streamId, logger })
    const myParser = new IFCParser({ serverApi, fileId, logger })

    const start = performance.now()
    const { id, tCount } = await myParser.parse(data)
    logger = logger.child({ objectId: id })
    const end = performance.now()
    logger.info(
      {
        fileProcessingDurationMs: (end - start).toFixed(2)
      },
      'Total processing time V2: {fileProcessingDurationMs}ms'
    )

    const commit = {
      streamId,
      branchName,
      objectId: id,
      message,
      sourceApplication: 'IFC',
      totalChildrenCount: tCount
    }

    if (!branchId) {
      logger.info("Branch '{branchName}' not found, creating it.")
      await serverApi.createBranch({
        name: branchName,
        streamId,
        description: branchName === 'uploads' ? 'File upload branch' : null,
        authorId: userId
      })
    }

    const userToken = process.env.USER_TOKEN

    const serverBaseUrl = process.env.SPECKLE_SERVER_URL || 'http://127.0.0.1:3000'
    logger.info(`Creating commit for object ({objectId}), with message "${message}"`)
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
    logger.info(json, 'Commit created')

    return json.data.commitCreate
  }
