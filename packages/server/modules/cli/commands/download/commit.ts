import fetch from 'cross-fetch'
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
  HttpLink,
  ApolloQueryResult
} from '@apollo/client/core'
import { CommandModule } from 'yargs'
import { getBaseUrl, getServerVersion } from '@/modules/shared/helpers/envHelper'
import { Commit } from '@/test/graphql/generated/graphql'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getStream, getStreamCollaborators } from '@/modules/core/repositories/streams'
import { Roles } from '@speckle/shared'
import { addCommitCreatedActivity } from '@/modules/activitystream/services/commitActivity'
import { createObject } from '@/modules/core/services/objects'
import { getObject } from '@/modules/core/repositories/objects'
import ObjectLoader from '@speckle/objectloader'
import { noop } from 'lodash'
import { cliLogger } from '@/logging/logging'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'

type LocalResources = Awaited<ReturnType<typeof getLocalResources>>
type ParsedCommitUrl = ReturnType<typeof parseCommitUrl>
type GraphQLClient = ApolloClient<NormalizedCacheObject>
type ObjectLoaderObject = Record<string, unknown> & {
  id: string
  speckle_type: string
  totalChildrenCount: number
}

const COMMIT_URL_RGX = /((https?:\/\/)?[\w.]+)\/streams\/([\w]+)\/commits\/([\w]+)/i

const testQuery = gql`
  query CommitDownloadTest {
    _
  }
`

const commitMetadataQuery = gql`
  query CommitDownloadMetadata($streamId: String!, $commitId: String!) {
    stream(id: $streamId) {
      commit(id: $commitId) {
        id
        referencedObject
        authorId
        message
        createdAt
        sourceApplication
        totalChildrenCount
        parents
      }
    }
  }
`

const assertValidGraphQLResult = (
  res: ApolloQueryResult<unknown>,
  operationName: string
) => {
  if (res.errors?.length) {
    throw new Error(
      `GQL operation '${operationName}' failed because of errors: ` +
        JSON.stringify(res.errors)
    )
  }
}

const parseCommitUrl = (url: string) => {
  const [, origin, , streamId, commitId] = COMMIT_URL_RGX.exec(url) || []
  if (!origin || !streamId || !commitId) {
    throw new Error("Couldn't parse commit URL! Does it follow the expected format?")
  }

  return { origin, streamId, commitId }
}

const getLocalResources = async (targetStreamId: string, branchName: string) => {
  const targetStream = await getStream({ streamId: targetStreamId })
  if (!targetStream) {
    throw new Error(`Couldn't find local stream with id ${targetStreamId}`)
  }

  const targetBranch = await getStreamBranchByName(targetStreamId, branchName)
  if (!targetBranch) {
    throw new Error(
      `Couldn't find local branch ${branchName} in stream ${targetStreamId}`
    )
  }

  const streamOwners = await getStreamCollaborators(targetStreamId, Roles.Stream.Owner)
  const owner = streamOwners[0]

  return { targetStream, targetBranch, owner }
}

const createApolloClient = async (origin: string): Promise<GraphQLClient> => {
  const cache = new InMemoryCache()
  const client = new ApolloClient({
    link: new HttpLink({ uri: `${origin}/graphql`, fetch }),
    cache,
    name: 'cli',
    version: getServerVersion(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'all'
      }
    }
  })

  // Test it out
  const res = await client.query({
    query: testQuery
  })

  assertValidGraphQLResult(res, 'Target server test query')

  if (!res.data?._) {
    throw new Error(
      "Couldn't construct working Apollo Client, test query failed cause of unexpected response: " +
        JSON.stringify(res.data)
    )
  }

  return client
}

const getCommitMetadata = async (client: GraphQLClient, params: ParsedCommitUrl) => {
  const { streamId, commitId } = params
  const results = await client.query({
    query: commitMetadataQuery,
    variables: { streamId, commitId }
  })
  assertValidGraphQLResult(results, 'Commit Metadata Query')

  const commit = results.data?.stream?.commit
  if (!commit) {
    throw new Error('Unexpectedly received invalid commit structure')
  }

  return commit as Commit
}

const saveNewCommit = async (commit: Commit, localResources: LocalResources) => {
  const { targetStream, targetBranch, owner } = localResources

  const streamId = targetStream.id
  const message = commit.message || null
  const objectId = commit.referencedObject
  const parents = (commit.parents || []).filter((p): p is NonNullable<typeof p> => !!p)
  const sourceApplication = commit.sourceApplication || null
  const totalChildrenCount = commit.totalChildrenCount

  const newCommit = await createCommitByBranchId({
    streamId,
    branchId: targetBranch.id,
    objectId,
    authorId: owner.id,
    message,
    sourceApplication,
    totalChildrenCount,
    parents: parents.length ? parents : null
  })
  const id = newCommit.id

  await addCommitCreatedActivity({
    commitId: id,
    streamId,
    userId: owner.id,
    input: {
      branchName: targetBranch.name,
      message,
      objectId,
      parents,
      sourceApplication,
      streamId,
      totalChildrenCount
    },
    branchName: targetBranch.name,
    commit: newCommit
  })

  return id
}

const createNewObject = async (
  newObject: ObjectLoaderObject,
  targetStreamId: string
) => {
  if (!newObject) {
    cliLogger.error('Encountered falsy object!')
    return
  }

  const newObjectId = await createObject(targetStreamId, {
    ...newObject,
    id: newObject.id,
    speckleType: newObject.speckleType || newObject.speckle_type || 'Base'
  })

  const newRecord = await getObject(newObjectId, targetStreamId)
  if (!newRecord) {
    throw new Error("Unexpected error! Just inserted an object, but can't find it!")
  }

  return newRecord
}

const loadAllObjectsFromParent = async (params: {
  targetStreamId: string
  sourceCommit: Commit
  parsedCommitUrl: ParsedCommitUrl
}) => {
  const {
    targetStreamId,
    sourceCommit,
    parsedCommitUrl: { origin, streamId: sourceStreamId }
  } = params

  // Initialize ObjectLoader
  const objectLoader = new ObjectLoader({
    serverUrl: origin,
    streamId: sourceStreamId,
    objectId: sourceCommit.referencedObject,
    options: { fetch, customLogger: noop }
  })

  // Iterate over all objects and download them into the DB
  const totalObjectCount = (sourceCommit.totalChildrenCount || 0) + 1
  let processedObjectCount = 1
  for await (const obj of objectLoader.getObjectIterator()) {
    const typedObj = obj as ObjectLoaderObject
    cliLogger.info(
      `Processing ${obj.id} - ${processedObjectCount++}/${totalObjectCount}`
    )
    await createNewObject(typedObj, targetStreamId)
  }
}

const command: CommandModule<
  unknown,
  { commitUrl: string; targetStreamId: string; branchName: string }
> = {
  command: 'commit <commitUrl> <targetStreamId> [branchName]',
  describe: 'Download a commit from an external Speckle server instance',
  builder: {
    commitUrl: {
      describe:
        'Commit URL (e.g. https://speckle.xyz/streams/f0532359ac/commits/98678e2a3d)',
      type: 'string'
    },
    targetStreamId: {
      describe: 'ID of the local stream that should receive the commit',
      type: 'string'
    },
    branchName: {
      describe: 'Stream branch that should receive the commit',
      type: 'string',
      default: 'main'
    }
  },
  handler: async (argv) => {
    const { commitUrl, targetStreamId, branchName } = argv
    cliLogger.info(`Process started at: ${new Date().toISOString()}`)

    const localResources = await getLocalResources(targetStreamId, branchName)
    cliLogger.info(
      `Using local branch ${branchName} of stream ${targetStreamId} to dump the incoming commit`
    )

    const parsedCommitUrl = parseCommitUrl(commitUrl)
    cliLogger.info('Loading the following commit: %s', parsedCommitUrl)

    const client = await createApolloClient(parsedCommitUrl.origin)
    const commit = await getCommitMetadata(client, parsedCommitUrl)
    cliLogger.info('Loaded commit metadata: %s', commit)

    const newCommitId = await saveNewCommit(commit, localResources)
    cliLogger.info(`Created new local commit: ${newCommitId}`)

    cliLogger.info(`Pulling & saving all objects! (${commit.totalChildrenCount})`)
    await loadAllObjectsFromParent({
      targetStreamId,
      sourceCommit: commit,
      parsedCommitUrl
    })

    const linkToNewCommit = `${getBaseUrl()}/streams/${targetStreamId}/commits/${newCommitId}`
    cliLogger.info(`All done! Find your commit here: ${linkToNewCommit}`)
  }
}

export = command
