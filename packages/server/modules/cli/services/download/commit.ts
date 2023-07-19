import fetch from 'cross-fetch'
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
  HttpLink,
  ApolloQueryResult
} from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context'
import { getFrontendOrigin, getServerVersion } from '@/modules/shared/helpers/envHelper'
import {
  Commit,
  ViewerResourceGroup,
  Comment,
  CreateCommentInput
} from '@/test/graphql/generated/graphql'
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
import { getUser } from '@/modules/core/repositories/users'
import type { SpeckleViewer } from '@speckle/shared'
import {
  createCommentThreadAndNotify,
  createCommentReplyAndNotify
} from '@/modules/comments/services/management'

type LocalResources = Awaited<ReturnType<typeof getLocalResources>>
type LocalResourcesWithCommit = LocalResources & { newCommitId: string }
type ParsedCommitUrl = Awaited<ReturnType<typeof parseIncomingUrl>>
type GraphQLClient = ApolloClient<NormalizedCacheObject>
type ObjectLoaderObject = Record<string, unknown> & {
  id: string
  speckle_type: string
  totalChildrenCount: number
}

const COMMIT_URL_RGX = /((https?:\/\/)?[\w.]+)\/streams\/([\w]+)\/commits\/([\w]+)/i
const MODEL_URL_RGX = /((https?:\/\/)?[\w.]+)\/projects\/([\w]+)\/models\/([\w@,]+)/i

const testQuery = gql`
  query CommitDownloadTest {
    _
  }
`

const commitBranchMetadataQuery = gql`
  query CommitBranchMetadata($streamId: String!, $commitId: String!) {
    stream(id: $streamId) {
      commit(id: $commitId) {
        id
        branchName
      }
    }
  }
`

const branchMetadataQuery = gql`
  query BranchMetadata($streamId: String!, $branchName: String!) {
    stream(id: $streamId) {
      branch(name: $branchName) {
        id
      }
    }
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

const viewerResourcesQuery = gql`
  query ProjectViewerResources($projectId: String!, $resourceUrlString: String!) {
    project(id: $projectId) {
      id
      viewerResources(resourceIdString: $resourceUrlString) {
        identifier
        items {
          modelId
          versionId
          objectId
        }
      }
    }
  }
`

const viewerThreadsQuery = gql`
  query DownloadableCommitViewerThreads(
    $projectId: String!
    $filter: ProjectCommentsFilter!
    $cursor: String
    $limit: Int = 25
  ) {
    project(id: $projectId) {
      id
      commentThreads(filter: $filter, cursor: $cursor, limit: $limit) {
        totalCount
        totalArchivedCount
        items {
          ...DownloadbleCommentMetadata
          replies(limit: $limit) {
            items {
              ...DownloadbleCommentMetadata
            }
          }
        }
      }
    }
  }

  fragment DownloadbleCommentMetadata on Comment {
    id
    text {
      doc
    }
    viewerState
    screenshot
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

const createApolloClient = async (
  origin: string,
  params?: { token?: string }
): Promise<GraphQLClient> => {
  const cache = new InMemoryCache()

  const baseLink = new HttpLink({ uri: `${origin}/graphql`, fetch })
  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: params?.token ? `Bearer ${params.token}` : ''
      }
    }
  })

  const client = new ApolloClient({
    link: authLink.concat(baseLink),
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

const parseCommitUrl = async (url: string, token?: string) => {
  const [, origin, , streamId, commitId] = COMMIT_URL_RGX.exec(url) || []
  if (!origin || !streamId || !commitId) {
    return undefined
  }

  // find branch id
  const client = await createApolloClient(origin, { token })
  const branchId = await getCommitBranchId(client, { streamId, commitId })
  if (!branchId) {
    return undefined
  }

  return { origin, streamId, commitId, isFe2: false, branchId }
}

const parseModelUrl = async (url: string, token?: string) => {
  const [, origin, , streamId, resourceUrlString] = MODEL_URL_RGX.exec(url) || []
  if (!origin || !streamId || !resourceUrlString) {
    return undefined
  }

  const client = await createApolloClient(origin, { token })
  const resources = await getViewerResources(client, {
    projectId: streamId,
    resourceUrlString
  })

  const firstCommitGroup = resources.find(
    (r) => r.items.length && r.items.find((i) => !!i.versionId && !!i.modelId)
  )
  if (!firstCommitGroup) return undefined

  const resource = firstCommitGroup.items.find((i) => !!i.versionId && !!i.modelId)
  if (!resource) return undefined

  return {
    origin,
    streamId,
    commitId: resource.versionId as string,
    branchId: resource.modelId as string,
    isFe2: true
  }
}

const parseIncomingUrl = async (url: string, token?: string) => {
  const commitUrl = await parseCommitUrl(url, token)
  if (commitUrl) {
    return commitUrl
  }

  const modelUrl = await parseModelUrl(url, token)
  if (modelUrl) {
    return modelUrl
  }

  throw new Error(`Couldn't parse commit URL: ${url}`)
}

const getLocalResources = async (
  targetStreamId: string,
  branchName: string,
  commentAuthorId?: string
) => {
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

  const commentAuthor = commentAuthorId ? await getUser(commentAuthorId) : null

  return { targetStream, targetBranch, owner, commentAuthor }
}

const getViewerResources = async (
  client: GraphQLClient,
  params: { projectId: string; resourceUrlString: string }
) => {
  const results = await client.query({
    query: viewerResourcesQuery,
    variables: params
  })
  assertValidGraphQLResult(results, 'Viewer Resources Query')

  const viewerResources = results.data?.project?.viewerResources
  if (!viewerResources) {
    throw new Error('Unexpectedly received invalid viewer resources structure')
  }

  return viewerResources as ViewerResourceGroup[]
}

const getCommitBranchId = async (
  client: GraphQLClient,
  params: { streamId: string; commitId: string }
) => {
  const { streamId, commitId } = params
  const commitBranchMetadataRes = await client.query({
    query: commitBranchMetadataQuery,
    variables: { streamId, commitId }
  })
  assertValidGraphQLResult(commitBranchMetadataRes, 'Commit Branch Metadata Query')

  const branchName = commitBranchMetadataRes.data?.stream?.commit?.branchName
  if (!branchName) {
    throw new Error('Could not resolve commit branch name')
  }

  const branchMetadataRes = await client.query({
    query: branchMetadataQuery,
    variables: { streamId, branchName }
  })
  assertValidGraphQLResult(branchMetadataRes, 'Branch Metadata Query')

  const branchId = branchMetadataRes.data?.stream?.branch?.id
  if (!branchId) {
    throw new Error('Could not resolve commit branch id')
  }

  return branchId as string
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

const getViewerThreads = async (client: GraphQLClient, params: ParsedCommitUrl) => {
  const { streamId, branchId, commitId } = params

  const results = await client.query({
    query: viewerThreadsQuery,
    variables: {
      projectId: streamId,
      filter: {
        resourceIdString: `${branchId}@${commitId}`,
        includeArchived: false,
        loadedVersionsOnly: true
      },
      limit: 100
    }
  })
  assertValidGraphQLResult(results, 'Viewer Threads Query')

  const threads = results.data?.project?.commentThreads?.items
  if (!threads) {
    throw new Error('Unexpectedly received invalid viewer threads structure')
  }

  return threads as Comment[]
}

const cleanViewerState = (
  state: SpeckleViewer.ViewerState.SerializedViewerState,
  localResources: LocalResourcesWithCommit
): SpeckleViewer.ViewerState.SerializedViewerState => ({
  ...state,
  projectId: localResources.targetStream.id,
  resources: {
    ...state.resources,
    request: {
      ...state.resources.request,
      resourceIdString: `${localResources.targetBranch.id}@${localResources.newCommitId}`
    }
  },
  ui: {
    ...state.ui,
    diff: {
      ...state.ui.diff,
      command: null // TODO: not supported currently
    }
  }
})

const saveNewThreads = async (
  threads: Comment[],
  localResources: LocalResourcesWithCommit
) => {
  const { commentAuthor, targetStream } = localResources
  if (!commentAuthor) return

  const threadInputs: { originalComment: Comment; input: CreateCommentInput }[] =
    threads.map((t) => ({
      originalComment: t,
      input: {
        projectId: targetStream.id,
        content: {
          doc: t.text.doc,
          blobIds: []
        },
        viewerState: t.viewerState
          ? cleanViewerState(
              t.viewerState as SpeckleViewer.ViewerState.SerializedViewerState,
              localResources
            )
          : null,
        screenshot: t.screenshot,
        resourceIdString: `${localResources.targetBranch.id}@${localResources.newCommitId}`
      }
    }))

  cliLogger.info(`Creating ${threadInputs.length} new comment threads...`)
  const res = await Promise.all(
    threadInputs.map((i) =>
      createCommentThreadAndNotify(i.input, commentAuthor.id).then((c) => ({
        originalData: i,
        newComment: c
      }))
    )
  )
  cliLogger.info(`...created ${res.length} new comment threads!`)

  for (const resItem of res) {
    const { originalData, newComment } = resItem
    const { originalComment } = originalData
    const { replies } = originalComment
    if (!replies) continue

    cliLogger.info(
      `Creating ${replies.items.length} new replies for comment thread ${originalComment.id}...`
    )
    await Promise.all(
      replies.items
        .filter((i) => !!i.text.doc)
        .map((r) =>
          createCommentReplyAndNotify(
            {
              content: {
                doc: r.text.doc,
                blobIds: []
              },
              threadId: newComment.id
            },
            commentAuthor.id
          )
        )
    )
    cliLogger.info(`...created ${replies.items.length} new replies!`)
  }
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
    modelId: targetBranch.id,
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

export const downloadCommit = async (
  argv: {
    commitUrl: string
    targetStreamId: string
    branchName: string
    token?: string
    commentAuthorId?: string
  },
  options?: Partial<{
    logger: typeof cliLogger
  }>
) => {
  const { commitUrl, targetStreamId, branchName, token, commentAuthorId } = argv
  const { logger = cliLogger } = options || {}

  logger.debug(`Process started at: ${new Date().toISOString()}`)

  const localResources = await getLocalResources(
    targetStreamId,
    branchName,
    commentAuthorId
  )
  logger.debug(
    `Using local branch ${branchName} of stream ${targetStreamId} to dump the incoming commit`
  )

  const parsedCommitUrl = await parseIncomingUrl(commitUrl, token)
  logger.debug('Loading the following commit: %s', JSON.stringify(parsedCommitUrl))

  const client = await createApolloClient(parsedCommitUrl.origin, { token })
  const commit = await getCommitMetadata(client, parsedCommitUrl)
  logger.debug('Loaded commit metadata: %s', JSON.stringify(commit))

  const newCommitId = await saveNewCommit(commit, localResources)
  const newResources = {
    ...localResources,
    newCommitId
  }

  logger.debug(`Created new local commit: ${newCommitId}`)

  logger.debug(`Pulling & saving all objects! (${commit.totalChildrenCount})`)
  await loadAllObjectsFromParent({
    targetStreamId,
    sourceCommit: commit,
    parsedCommitUrl
  })

  if (localResources.commentAuthor) {
    logger.debug(`Pulling & saving all comments w/ #${commentAuthorId} as author!`)
    const threads = await getViewerThreads(client, parsedCommitUrl)
    await saveNewThreads(threads, newResources)
  }

  const linkToNewCommit = parsedCommitUrl.isFe2
    ? `${getFrontendOrigin(true)}/projects/${targetStreamId}/models/${
        localResources.targetBranch.id
      }@${newCommitId}`
    : `${getFrontendOrigin()}/streams/${targetStreamId}/commits/${newCommitId}`
  logger.debug(`All done! Find your commit here: ${linkToNewCommit}`)

  return {
    linkToNewCommit,
    streamId: targetStreamId,
    commitId: newCommitId,
    branchId: localResources.targetBranch.id
  }
}
