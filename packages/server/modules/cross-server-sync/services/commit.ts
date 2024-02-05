import fetch from 'cross-fetch'
import { ApolloClient, NormalizedCacheObject, gql } from '@apollo/client/core'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { CreateCommentInput } from '@/test/graphql/generated/graphql'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'
import { getStream, getStreamCollaborators } from '@/modules/core/repositories/streams'
import { Roles, timeoutAt } from '@speckle/shared'
import { addCommitCreatedActivity } from '@/modules/activitystream/services/commitActivity'
import { createObject } from '@/modules/core/services/objects'
import { getObject } from '@/modules/core/repositories/objects'
import ObjectLoader from '@speckle/objectloader'
import { noop } from 'lodash'
import { Logger, crossServerSyncLogger } from '@/logging/logging'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import { getUser } from '@/modules/core/repositories/users'
import type { SpeckleViewer } from '@speckle/shared'
import { retry } from '@speckle/shared'
import {
  createCommentThreadAndNotify,
  createCommentReplyAndNotify
} from '@/modules/comments/services/management'
import {
  createApolloClient,
  assertValidGraphQLResult
} from '@/modules/cross-server-sync/utils/graphqlClient'
import { CrossServerCommitSyncError } from '@/modules/cross-server-sync/errors'
import {
  CrossSyncBranchMetadataQuery,
  CrossSyncCommitBranchMetadataQuery,
  CrossSyncCommitDownloadMetadataQuery,
  CrossSyncDownloadableCommitViewerThreadsQuery,
  CrossSyncProjectViewerResourcesQuery
} from '@/modules/cross-server-sync/graph/generated/graphql'

type LocalResources = Awaited<ReturnType<typeof getLocalResources>>
type LocalResourcesWithCommit = LocalResources & { newCommitId: string }
type ParsedCommitUrl = Awaited<ReturnType<typeof parseIncomingUrl>>
type GraphQLClient = ApolloClient<NormalizedCacheObject>
type ObjectLoaderObject = Record<string, unknown> & {
  id: string
  speckle_type: string
  totalChildrenCount: number
}

type CommitMetadata = Awaited<ReturnType<typeof getCommitMetadata>>
type ViewerThread = Awaited<ReturnType<typeof getViewerThreads>>[0]

const COMMIT_URL_RGX = /((https?:\/\/)?[\w.\-_]+)\/streams\/([\w]+)\/commits\/([\w]+)/i
const MODEL_URL_RGX = /((https?:\/\/)?[\w.\-_]+)\/projects\/([\w]+)\/models\/([\w@,]+)/i

const commitBranchMetadataQuery = gql`
  query CrossSyncCommitBranchMetadata($streamId: String!, $commitId: String!) {
    stream(id: $streamId) {
      commit(id: $commitId) {
        id
        branchName
      }
    }
  }
`

const branchMetadataQuery = gql`
  query CrossSyncBranchMetadata($streamId: String!, $branchName: String!) {
    stream(id: $streamId) {
      branch(name: $branchName) {
        id
      }
    }
  }
`

const commitMetadataQuery = gql`
  query CrossSyncCommitDownloadMetadata($streamId: String!, $commitId: String!) {
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
  query CrossSyncProjectViewerResources(
    $projectId: String!
    $resourceUrlString: String!
  ) {
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
  query CrossSyncDownloadableCommitViewerThreads(
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

  throw new CrossServerCommitSyncError(`Couldn't parse commit URL: ${url}`)
}

const getLocalResources = async (
  targetStreamId: string,
  branchName: string,
  commentAuthorId?: string
) => {
  const targetStream = await getStream({ streamId: targetStreamId })
  if (!targetStream) {
    throw new CrossServerCommitSyncError(
      `Couldn't find local stream with id ${targetStreamId}`
    )
  }

  const targetBranch = await getStreamBranchByName(targetStreamId, branchName)
  if (!targetBranch) {
    throw new CrossServerCommitSyncError(
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
  const results = await client.query<CrossSyncProjectViewerResourcesQuery>({
    query: viewerResourcesQuery,
    variables: params
  })
  assertValidGraphQLResult(results, 'Viewer Resources Query')

  const viewerResources = results.data?.project?.viewerResources
  if (!viewerResources) {
    throw new CrossServerCommitSyncError(
      'Unexpectedly received invalid viewer resources structure'
    )
  }

  return viewerResources
}

const getCommitBranchId = async (
  client: GraphQLClient,
  params: { streamId: string; commitId: string }
) => {
  const { streamId, commitId } = params
  const commitBranchMetadataRes =
    await client.query<CrossSyncCommitBranchMetadataQuery>({
      query: commitBranchMetadataQuery,
      variables: { streamId, commitId }
    })
  assertValidGraphQLResult(commitBranchMetadataRes, 'Commit Branch Metadata Query')

  const branchName = commitBranchMetadataRes.data?.stream?.commit?.branchName
  if (!branchName) {
    throw new CrossServerCommitSyncError('Could not resolve commit branch name')
  }

  const branchMetadataRes = await client.query<CrossSyncBranchMetadataQuery>({
    query: branchMetadataQuery,
    variables: { streamId, branchName }
  })
  assertValidGraphQLResult(branchMetadataRes, 'Branch Metadata Query')

  const branchId = branchMetadataRes.data?.stream?.branch?.id
  if (!branchId) {
    throw new CrossServerCommitSyncError('Could not resolve commit branch id')
  }

  return branchId
}

const getCommitMetadata = async (client: GraphQLClient, params: ParsedCommitUrl) => {
  const { streamId, commitId } = params
  const results = await client.query<CrossSyncCommitDownloadMetadataQuery>({
    query: commitMetadataQuery,
    variables: { streamId, commitId }
  })
  assertValidGraphQLResult(results, 'Commit Metadata Query')

  const commit = results.data?.stream?.commit
  if (!commit) {
    throw new CrossServerCommitSyncError(
      'Unexpectedly received invalid commit structure'
    )
  }

  return commit
}

const getViewerThreads = async (client: GraphQLClient, params: ParsedCommitUrl) => {
  const { streamId, branchId, commitId } = params

  const results = await client.query<CrossSyncDownloadableCommitViewerThreadsQuery>({
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
    throw new CrossServerCommitSyncError(
      'Unexpectedly received invalid viewer threads structure'
    )
  }

  return threads
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
  threads: ViewerThread[],
  localResources: LocalResourcesWithCommit,
  options?: Partial<{
    logger: typeof crossServerSyncLogger
  }>
) => {
  const { logger = crossServerSyncLogger } = options || {}
  const { commentAuthor, targetStream } = localResources
  if (!commentAuthor) return

  const threadInputs: { originalComment: ViewerThread; input: CreateCommentInput }[] =
    threads
      .filter((t) => !!t.text.doc)
      .map((t) => ({
        originalComment: t,
        input: {
          projectId: targetStream.id,
          content: {
            doc: t.text.doc,
            blobIds: [] // TODO: Currently not supported
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
  if (!threadInputs.length) return

  logger.info(`Creating ${threadInputs.length} new comment threads...`)
  const res = await Promise.all(
    threadInputs.map((i) =>
      createCommentThreadAndNotify(i.input, commentAuthor.id).then((c) => ({
        originalData: i,
        newComment: c
      }))
    )
  )
  logger.info(`...created ${res.length} new comment threads!`)

  for (const resItem of res) {
    const { originalData, newComment } = resItem
    const { originalComment } = originalData
    const { replies } = originalComment
    if (!replies) continue

    logger.info(
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
    logger.info(`...created ${replies.items.length} new replies!`)
  }
}

const saveNewCommit = async (
  commit: CommitMetadata,
  localResources: LocalResources
) => {
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
  targetStreamId: string,
  options?: Partial<{
    logger: typeof crossServerSyncLogger
  }>
) => {
  const { logger = crossServerSyncLogger } = options || {}
  if (!newObject) {
    logger.error('Encountered falsy object!')
    return
  }

  const newObjectId = await createObject(targetStreamId, {
    ...newObject,
    id: newObject.id,
    speckleType: newObject.speckleType || newObject.speckle_type || 'Base'
  })

  const newRecord = await getObject(newObjectId, targetStreamId)
  if (!newRecord) {
    throw new CrossServerCommitSyncError(
      "Unexpected error! Just inserted an object, but can't find it!"
    )
  }

  return newRecord
}

const loadAllObjectsFromParent = async (
  params: {
    targetStreamId: string
    sourceCommit: CommitMetadata
    parsedCommitUrl: ParsedCommitUrl
  },
  options?: Partial<{
    logger: typeof crossServerSyncLogger
  }>
) => {
  const { logger = crossServerSyncLogger } = options || {}
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
  const batchSize = 50
  let batchPromises: Promise<unknown>[] = []
  let processedObjectCount = 1

  for await (const obj of objectLoader.getObjectIterator()) {
    const typedObj = obj as ObjectLoaderObject
    const work = async () => {
      const id = `${obj.id} - ${processedObjectCount++}/${totalObjectCount}`
      logger.debug(`Processing ${id}...`)
      await retry(
        () =>
          Promise.race([
            createNewObject(typedObj, targetStreamId, { logger }),
            timeoutAt(30 * 1000, `Object create timed out! - ${id}`)
          ]),
        3
      )
      logger.debug(`Processed! ${id}`)
    }

    batchPromises.push(work())
    if (batchPromises.length >= batchSize) {
      await Promise.all(batchPromises)
      batchPromises = []
    }
  }
}

/**
 * Downloads a commit/version (both FE1 and FE2 supported) from an external Speckle server instance
 */
export const downloadCommit = async (
  argv: {
    /**
     * A FE1 commit URL or an FE2 model/version URL
     */
    commitUrl: string
    /**
     * ID of the local stream that should receive the commit
     */
    targetStreamId: string
    /**
     * Stream branch that should receive the commit. Defaults to 'main'
     */
    branchName?: string
    /**
     * Specify if target commit is private
     */
    token?: string
    /**
     * Specify if you want comments to be pulled in also
     */
    commentAuthorId?: string
  },
  options?: Partial<{
    logger: Logger
  }>
) => {
  const {
    commitUrl,
    targetStreamId,
    branchName = 'main',
    token,
    commentAuthorId
  } = argv
  const { logger = crossServerSyncLogger } = options || {}

  logger.debug(`Commit/version download started at: ${new Date().toISOString()}`)

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
  await loadAllObjectsFromParent(
    {
      targetStreamId,
      sourceCommit: commit,
      parsedCommitUrl
    },
    { logger }
  )

  if (localResources.commentAuthor) {
    logger.debug(`Pulling & saving all comments w/ #${commentAuthorId} as author!`)
    const threads = await getViewerThreads(client, parsedCommitUrl)
    await saveNewThreads(threads, newResources, { logger })
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
