/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { performance } from 'perf_hooks'
import { fetch } from 'undici'
import Parser from '@/ifc/parser.js'
import { ServerAPI } from '@/controller/api.js'
import Observability from '@speckle/shared/dist/commonjs/observability/index.js'
import { logger as parentLogger } from '@/observability/logging.js'
import { Knex } from 'knex'
import { Logger } from 'pino'

export const parseAndCreateCommitFactory =
  ({ db }: { db: Knex }) =>
  async ({
    data,
    streamId,
    branchName = 'uploads',
    userId,
    message = 'Manual IFC file upload',
    fileId,
    branchId,
    logger
  }: {
    data: unknown
    streamId: string
    branchName: string
    userId: string
    message: string
    fileId: string
    branchId: string
    logger: Logger
  }) => {
    if (!logger) {
      logger = Observability.extendLoggerComponent(
        parentLogger.child({ streamId, branchName, userId, fileId }),
        'ifc'
      )
    }
    const serverApi = new ServerAPI({ db, streamId, logger })
    const myParser = new Parser({ serverApi, fileId, logger })

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
        description: branchName === 'uploads' ? 'File upload branch' : '',
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

    if (!response.ok) {
      throw new Error('Unable to create commit')
    }
    const json = await response.json()

    if (isCommitCreateResponse(json)) {
      logger.info(json, 'Commit created')

      return json.data.commitCreate
    }
    throw new Error(`Unexpected response ${JSON.stringify(json)}`)
  }

const isCommitCreateResponse = (
  maybeCommitCreateResponse: unknown
): maybeCommitCreateResponse is { data: { commitCreate: string } } => {
  return (
    !!maybeCommitCreateResponse &&
    typeof maybeCommitCreateResponse === 'object' &&
    'data' in maybeCommitCreateResponse &&
    !!maybeCommitCreateResponse.data &&
    typeof maybeCommitCreateResponse.data === 'object' &&
    'commitCreate' in maybeCommitCreateResponse.data &&
    typeof maybeCommitCreateResponse.data.commitCreate === 'string'
  )
}
