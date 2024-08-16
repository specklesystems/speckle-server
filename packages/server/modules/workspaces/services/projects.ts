import { StreamRecord } from '@/modules/core/helpers/types'
import { convertDateToCursor, parseCursorToDate } from '@/modules/core/services/admin'
import { getStreams as serviceGetStreams } from '@/modules/core/services/streams'
import { QueryAllWorkspaceProjects } from '@/modules/workspaces/domain/operations'
import { WorkspaceQueryError } from '@/modules/workspaces/errors/workspace'

export const queryAllWorkspaceProjectsFactory = ({
  getStreams
}: {
  // TODO: Core service factory functions
  getStreams: typeof serviceGetStreams
}): QueryAllWorkspaceProjects =>
  async function* queryAllWorkspaceProjects({
    workspaceId
  }): AsyncGenerator<StreamRecord[], void, unknown> {
    let cursor: Date | null = null
    let iterationCount = 0

    do {
      if (iterationCount > 500) throw new WorkspaceQueryError()

      const { streams, cursorDate } = await getStreams({
        cursor,
        orderBy: null,
        limit: 1000,
        visibility: null,
        searchQuery: null,
        streamIdWhitelist: null,
        workspaceIdWhitelist: [workspaceId]
      })

      yield streams

      cursor = cursorDate
      iterationCount++
    } while (!!cursor)
  }

type GetWorkspaceProjectsArgs = {
  workspaceId: string
}

type GetWorkspaceProjectsOptions = {
  limit: number | null
  cursor: string | null
  filter: {
    search?: string | null
  } | null
}

type GetWorkspaceProjectsReturnValue = {
  items: StreamRecord[]
  cursor: string | null
  totalCount: number
}

export const getWorkspaceProjectsFactory =
  ({ getStreams }: { getStreams: typeof serviceGetStreams }) =>
  async (
    args: GetWorkspaceProjectsArgs,
    opts: GetWorkspaceProjectsOptions
  ): Promise<GetWorkspaceProjectsReturnValue> => {
    const { streams, cursorDate, totalCount } = await getStreams({
      cursor: opts.cursor ? parseCursorToDate(opts.cursor) : null,
      orderBy: null,
      limit: opts.limit || 25,
      visibility: null,
      searchQuery: opts.filter?.search || null,
      streamIdWhitelist: null,
      workspaceIdWhitelist: [args.workspaceId]
    })

    return {
      items: streams,
      cursor: cursorDate ? convertDateToCursor(cursorDate) : null,
      totalCount
    }
  }
