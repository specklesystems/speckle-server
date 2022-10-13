import fetch from 'cross-fetch'
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
  HttpLink,
  ApolloQueryResult
} from '@apollo/client/core'
import { cliDebug } from '@/modules/shared/utils/logger'
import { CommandModule } from 'yargs'
import { getBaseUrl, getServerVersion } from '@/modules/shared/helpers/envHelper'
import { Commit, Object as SpeckleObject } from '@/test/graphql/generated/graphql'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getStream, getStreamCollaborators } from '@/modules/core/repositories/streams'
import { createCommitByBranchId } from '@/modules/core/services/commits'
import { Roles, batchAsyncOperations } from '@speckle/shared'
import { addCommitCreatedActivity } from '@/modules/activitystream/services/commitActivity'
import { createObject } from '@/modules/core/services/objects'
import { ObjectRecord } from '@/modules/core/helpers/types'
import { difference, uniq } from 'lodash'
import { getObject } from '@/modules/core/repositories/objects'

type LocalResources = Awaited<ReturnType<typeof getLocalResources>>
type ParsedCommitUrl = ReturnType<typeof parseCommitUrl>
type GraphQLClient = ApolloClient<NormalizedCacheObject>

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

const objectMetadataQuery = gql`
  query CommitDownloadObjectMetadata($streamId: String!, $objectId: String!) {
    stream(id: $streamId) {
      object(id: $objectId) {
        id
        speckleType
        totalChildrenCount
        createdAt
        data
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
  const message = commit.message
  const objectId = commit.referencedObject
  const parents = commit.parents
  const sourceApplication = commit.sourceApplication
  const totalChildrenCount = commit.totalChildrenCount

  const id = await createCommitByBranchId({
    streamId,
    branchId: targetBranch.id,
    objectId,
    authorId: owner.id,
    message,
    sourceApplication,
    totalChildrenCount,
    parents
  })

  await addCommitCreatedActivity({
    commitId: id,
    streamId,
    userId: owner.id,
    commit: {
      branchName: targetBranch.name,
      message,
      objectId,
      parents,
      sourceApplication,
      streamId,
      totalChildrenCount
    },
    branchName: targetBranch.name
  })

  return id
}

const getObjectMetadata = async (
  client: GraphQLClient,
  params: { streamId: string; objectId: string }
) => {
  const { streamId, objectId } = params
  const results = await client.query({
    query: objectMetadataQuery,
    variables: { streamId, objectId }
  })
  assertValidGraphQLResult(results, 'Object Metadata Query')

  const object = results.data?.stream?.object
  if (!object) {
    throw new Error('Unexpectedly received invalid object structure')
  }

  return object as SpeckleObject
}

const createNewObject = async (newObject: SpeckleObject, targetStreamId: string) => {
  const newObjectId = await createObject(targetStreamId, {
    ...(newObject.data || {}),
    id: newObject.id,
    speckleType: newObject.speckleType || 'Base'
  })
  const newRecord = await getObject(newObjectId)
  if (!newRecord) {
    throw new Error("Unexpected error! Just inserted an object, but can't find it!")
  }

  return newRecord
}

const getObjectChildrenIds = (obj: ObjectRecord) => {
  const { __closure } = (obj.data || {}) as {
    __closure?: Record<string, number>
  }
  return uniq(Object.keys(__closure || {}))
}

const downloadObject = async (
  client: GraphQLClient,
  params: { sourceStreamId: string; objectId: string; targetStreamId: string }
) => {
  const { sourceStreamId, objectId, targetStreamId } = params

  const sourceObject = await getObjectMetadata(client, {
    streamId: sourceStreamId,
    objectId
  })
  return await createNewObject(sourceObject, targetStreamId)
}

const loadAllObjectsFromParent = async (
  client: GraphQLClient,
  params: {
    newCommitId: string
    targetStreamId: string
    parentObjectId: string
    sourceStreamId: string
    totalChildrenCount: number
  }
) => {
  const { parentObjectId, targetStreamId, sourceStreamId, totalChildrenCount } = params

  // Download parent and collect the first set of children
  const parentObject = await downloadObject(client, {
    sourceStreamId,
    objectId: parentObjectId,
    targetStreamId
  })
  const firstSetOfChildrenIds = getObjectChildrenIds(parentObject)

  let traversedObjectIds: string[] = []

  /**
   * Download all children objects in a batched manner and return newly discovered object IDs
   * that will need to be downloaded
   */
  const downloadParentChildren = async (newObjectIds: string[], jobId: number) => {
    const uniqueNewObjectIds = difference(newObjectIds, traversedObjectIds)
    if (!uniqueNewObjectIds.length) return [] // no more work here

    // Mark object ids as traversed
    traversedObjectIds = uniq(traversedObjectIds.concat(uniqueNewObjectIds))

    let newlyDiscoveredObjectIds: string[] = []
    await batchAsyncOperations(
      `Loading ${newObjectIds.length} children objects <Job #${jobId + 1}>`,
      newObjectIds,
      async (oid) => {
        const dowloadedChild = await downloadObject(client, {
          sourceStreamId,
          objectId: oid,
          targetStreamId
        })

        // Find new object IDs to load
        const newChildrenIds = getObjectChildrenIds(dowloadedChild)
        const newUniqueChildrenIds = difference(newChildrenIds, traversedObjectIds)
        if (newUniqueChildrenIds.length) {
          newlyDiscoveredObjectIds =
            newlyDiscoveredObjectIds.concat(newUniqueChildrenIds)
        }
      },
      {
        logger: cliDebug,
        dropReturns: true
      }
    )

    return newlyDiscoveredObjectIds
  }

  let jobId = 0
  let queuableObjectIds: string[] = firstSetOfChildrenIds
  let remainingItemCount = totalChildrenCount

  while (queuableObjectIds.length && remainingItemCount > 0) {
    remainingItemCount -= queuableObjectIds.length
    queuableObjectIds = await downloadParentChildren(firstSetOfChildrenIds, jobId++)
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
    cliDebug(`Process started at: ${new Date().toISOString()}`)

    const localResources = await getLocalResources(targetStreamId, branchName)
    cliDebug(
      `Using local branch ${branchName} of stream ${targetStreamId} to dump the incoming commit`
    )

    const parsedCommitUrl = parseCommitUrl(commitUrl)
    cliDebug('Loading the following commit: ', parsedCommitUrl)

    const client = await createApolloClient(parsedCommitUrl.origin)
    const commit = await getCommitMetadata(client, parsedCommitUrl)
    cliDebug('Loaded commit metadata', commit)

    const newCommitId = await saveNewCommit(commit, localResources)
    cliDebug(`Created new local commit: ${newCommitId}`)

    cliDebug(`Pulling & saving all objects! (${commit.totalChildrenCount})`)
    await loadAllObjectsFromParent(client, {
      newCommitId,
      targetStreamId,
      parentObjectId: commit.referencedObject,
      sourceStreamId: parsedCommitUrl.streamId,
      totalChildrenCount: commit.totalChildrenCount || 0
    })

    const linkToNewCommit = `${getBaseUrl()}/streams/${targetStreamId}/commits/${newCommitId}`
    cliDebug(`All done! Find your commit here: ${linkToNewCommit}`)
  }
}

export = command
