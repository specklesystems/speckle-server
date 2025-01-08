import { type Logger } from '@/logging/logging'
import { StreamRecord } from '@/modules/core/helpers/types'

export type DownloadCommit = (
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

    /**
     * Specify if you want to sync in automation statuses. If set to true, the Project.version
     * query will be used, which might not be supported if you're targetting an old server instance.
     */
    loadAutomations?: boolean
  },
  options?: Partial<{
    logger: Logger
  }>
) => Promise<{
  linkToNewCommit: string
  streamId: string
  commitId: string
  branchId: string
}>

export type DownloadProject = (
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
    /**
     * Specify if target project is private
     */
    token?: string
    /**
     * Specify a target workspace to download into
     * The author needs to be member of the workspace
     */
    workspaceId?: string
    regionKey?: string
  },
  options?: Partial<{
    logger: Logger
  }>
) => Promise<{
  newProjectUrl: string
  projectId: string
  project: StreamRecord
}>

export type GetOnboardingBaseProject = () => Promise<StreamRecord | undefined>
export type EnsureOnboardingProject = () => Promise<StreamRecord | undefined>
