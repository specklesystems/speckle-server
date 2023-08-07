import { crossServerSyncLogger, Logger } from '@/logging/logging'
import { getUser } from '@/modules/core/repositories/users'
import { CrossServerProjectSyncError } from '@/modules/cross-server-sync/errors'
import {
  createApolloClient,
  GraphQLClient,
  gql,
  assertValidGraphQLResult
} from '@/modules/cross-server-sync/utils/graphqlClient'
import { CrossSyncProjectMetadataQuery } from '@/modules/cross-server-sync/graph/generated/graphql'
import { omit } from 'lodash'
import { downloadCommit } from '@/modules/cross-server-sync/services/commit'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import { createBranchAndNotify } from '@/modules/core/services/branch/management'
import { getStreamBranchByName } from '@/modules/core/repositories/branches'

type ProjectMetadata = Awaited<ReturnType<typeof getProjectMetadata>>

const PROJECT_URL_RGX = /((https?:\/\/)?[\w.]+)\/projects\/([\w]+)\/?/i

const projectMetadataQuery = gql`
  query CrossSyncProjectMetadata($id: String!, $versionsCursor: String) {
    project(id: $id) {
      id
      name
      description
      visibility
      versions(limit: 100, cursor: $versionsCursor) {
        totalCount
        cursor
        items {
          id
          createdAt
          model {
            id
            name
          }
        }
      }
    }
  }
`

const getLocalResources = async (params: { authorId: string }) => {
  const { authorId } = params
  const user = await getUser(authorId)
  if (!user) {
    throw new CrossServerProjectSyncError('Target author not found')
  }

  return { user }
}

const parseIncomingUrl = (projectUrl: string) => {
  const [, origin, , projectId] = PROJECT_URL_RGX.exec(projectUrl) || []
  if (!origin || !projectId) {
    throw new CrossServerProjectSyncError('Invalid project URL')
  }

  return { origin, projectId }
}

const getProjectMetadata = async (params: {
  client: GraphQLClient
  projectId: string
}) => {
  const { client, projectId } = params

  // Load 1st page
  const res = await client.query<CrossSyncProjectMetadataQuery>({
    query: projectMetadataQuery,
    variables: {
      id: projectId
    }
  })
  assertValidGraphQLResult(res, 'Project metadata query')

  const projectInfo = omit(res.data.project, ['versions'])
  const versions = res.data.project.versions.items

  // Load all pages of versions
  let cursor = res.data.project.versions.cursor
  let failsafe = 10
  while (cursor && failsafe-- > 0) {
    const res = await client.query<CrossSyncProjectMetadataQuery>({
      query: projectMetadataQuery,
      variables: {
        id: projectId,
        versionsCursor: cursor
      }
    })
    assertValidGraphQLResult(res, 'Project metadata query')
    versions.push(...res.data.project.versions.items)
    cursor = res.data.project.versions.cursor
  }

  // Sort versions by descending creation data
  versions.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return { projectInfo, versions }
}

const ensureBranch = async (params: {
  streamId: string
  branchName: string
  authorId: string
}) => {
  const { streamId, branchName, authorId } = params
  const existingBranch = await getStreamBranchByName(streamId, branchName)
  if (!existingBranch) {
    const newBranch = await createBranchAndNotify(
      {
        streamId,
        name: branchName
      },
      authorId
    )
    return newBranch
  }

  return existingBranch
}

const importVersions = async (params: {
  logger: Logger
  projectInfo: ProjectMetadata
  localProjectId: string
  localAuthorId: string
  origin: string
  syncComments?: boolean
}) => {
  const { logger, projectInfo, origin, localProjectId, syncComments, localAuthorId } =
    params
  const projectId = projectInfo.projectInfo.id

  logger.debug(`Serially downloading ${projectInfo.versions.length} versions...`)
  for (const version of projectInfo.versions) {
    // Ensure branch exists
    const branchName = version.model.name
    await ensureBranch({
      streamId: localProjectId,
      branchName,
      authorId: localAuthorId
    })

    // Actually download
    const url = new URL(
      `/projects/${projectId}/models/${version.model.id}@${version.id}`,
      origin
    )
    await downloadCommit(
      {
        commitUrl: url.toString(),
        targetStreamId: localProjectId,
        commentAuthorId: syncComments ? localAuthorId : undefined,
        branchName
      },
      { logger }
    )
  }
}

/**
 * Downloads a project from an external FE2 Speckle server instance
 */
export const downloadProject = async (
  params: {
    /**
     * An FE2 project URL (must be publicly accessible)
     */
    projectUrl: string
    /**
     * ID of user that should own the project locally
     */
    authorId: string
    syncComments?: boolean
  },
  options?: Partial<{
    logger: Logger
  }>
) => {
  const { projectUrl, authorId, syncComments } = params
  const { logger = crossServerSyncLogger } = options || {}

  logger.info(`Project download started at: ${new Date().toISOString()}`)

  const localResources = await getLocalResources({ authorId })
  const parsedUrl = parseIncomingUrl(projectUrl)
  const client = await createApolloClient(parsedUrl.origin)

  logger.debug(`Resolving project metadata and associated versions...`)
  const projectInfo = await getProjectMetadata({
    client,
    projectId: parsedUrl.projectId
  })

  logger.debug(`Creating project locally...`)
  const project = await createStreamReturnRecord({
    ...projectInfo.projectInfo,
    ownerId: localResources.user.id
  })

  await importVersions({
    logger,
    projectInfo,
    localProjectId: project.id,
    localAuthorId: localResources.user.id,
    origin: parsedUrl.origin,
    syncComments
  })
  logger.info(`Project download completed at: ${new Date().toISOString()}`)

  const newProjectUrl = new URL(
    `/projects/${project.id}`,
    getFrontendOrigin(true)
  ).toString()
  logger.info(`New Project URL: ${newProjectUrl}`)

  return {
    newProjectUrl,
    projectId: project.id,
    project
  }
}
