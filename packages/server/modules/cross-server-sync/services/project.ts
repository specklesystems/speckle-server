import { crossServerSyncLogger, Logger } from '@/logging/logging'
import { CrossServerProjectSyncError } from '@/modules/cross-server-sync/errors'
import {
  createApolloClient,
  GraphQLClient,
  gql,
  assertValidGraphQLResult
} from '@/modules/cross-server-sync/utils/graphqlClient'
import { CrossSyncProjectMetadataQuery } from '@/modules/cross-server-sync/graph/generated/graphql'
import { omit } from 'lodash'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  DownloadCommit,
  DownloadProject
} from '@/modules/cross-server-sync/domain/operations'
import {
  CreateBranchAndNotify,
  GetStreamBranchByName
} from '@/modules/core/domain/branches/operations'
import { CreateProject } from '@/modules/core/domain/projects/operations'
import { GetUser } from '@/modules/core/domain/users/operations'

type ProjectMetadata = Awaited<ReturnType<typeof getProjectMetadata>>

const PROJECT_URL_RGX = /((https?:\/\/)?[\w.\-_]+)\/projects\/([\w]+)\/?/i

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

type GetLocalResourcesDeps = {
  getUser: GetUser
}

const getLocalResourcesFactory =
  (deps: GetLocalResourcesDeps) => async (params: { authorId: string }) => {
    const { authorId } = params
    const user = await deps.getUser(authorId)
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

type EnsureBranchDeps = {
  getStreamBranchByName: GetStreamBranchByName
  createBranchAndNotify: CreateBranchAndNotify
}

const ensureBranchFactory =
  (deps: EnsureBranchDeps) =>
  async (params: { streamId: string; branchName: string; authorId: string }) => {
    const { streamId, branchName, authorId } = params
    const existingBranch = await deps.getStreamBranchByName(streamId, branchName)
    if (!existingBranch) {
      const newBranch = await deps.createBranchAndNotify(
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

type ImportVersionsDeps = {
  downloadCommit: DownloadCommit
} & EnsureBranchDeps

const importVersionsFactory =
  (deps: ImportVersionsDeps) =>
  async (params: {
    logger: Logger
    projectInfo: ProjectMetadata
    localProjectId: string
    localAuthorId: string
    origin: string
    syncComments?: boolean
    token?: string
  }) => {
    const {
      logger,
      projectInfo,
      origin,
      localProjectId,
      syncComments,
      localAuthorId,
      token
    } = params
    const projectId = projectInfo.projectInfo.id

    logger.debug(`Serially downloading ${projectInfo.versions.length} versions...`)
    for (const version of projectInfo.versions) {
      // Ensure branch exists
      const branchName = version.model.name
      await ensureBranchFactory(deps)({
        streamId: localProjectId,
        branchName,
        authorId: localAuthorId
      })

      // Actually download
      const url = new URL(
        `/projects/${projectId}/models/${version.model.id}@${version.id}`,
        origin
      )

      await deps.downloadCommit(
        {
          commitUrl: url.toString(),
          targetStreamId: localProjectId,
          commentAuthorId: syncComments ? localAuthorId : undefined,
          branchName,
          token
        },
        { logger }
      )
    }
  }

type DownloadProjectDeps = {
  createNewProject: CreateProject
} & GetLocalResourcesDeps &
  ImportVersionsDeps

/**
 * Downloads a project from an external FE2 Speckle server instance
 */
export const downloadProjectFactory =
  (deps: DownloadProjectDeps): DownloadProject =>
  async (params, options) => {
    const { projectUrl, authorId, syncComments, token, workspaceId, regionKey } = params
    const { logger = crossServerSyncLogger } = options || {}

    logger.info(`Project download started at: ${new Date().toISOString()}`)

    const localResources = await getLocalResourcesFactory(deps)({ authorId })
    const parsedUrl = parseIncomingUrl(projectUrl)
    const client = await createApolloClient(parsedUrl.origin, { token })

    logger.debug(`Resolving project metadata and associated versions...`)
    const projectInfo = await getProjectMetadata({
      client,
      projectId: parsedUrl.projectId
    })

    logger.debug(`Creating project locally...`)
    const project = await deps.createNewProject({
      ...projectInfo.projectInfo,
      workspaceId,
      ownerId: localResources.user.id,
      regionKey
    })

    await importVersionsFactory(deps)({
      logger,
      projectInfo,
      localProjectId: project.id,
      localAuthorId: localResources.user.id,
      origin: parsedUrl.origin,
      syncComments,
      token
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
