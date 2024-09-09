import { type Logger } from '@/logging/logging'

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
