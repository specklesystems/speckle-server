import { StreamRecord } from '@/modules/core/helpers/types'
import { getStreams as repoGetStreams } from '@/modules/core/services/streams'
import { WorkspaceQueryError } from '@/modules/workspaces/errors/workspace'

export const queryAllWorkspaceProjectsFactory = ({
  getStreams
}: {
  // TODO: Core service factory functions
  getStreams: typeof repoGetStreams
}) =>
  async function* queryAllWorkspaceProjects(
    workspaceId: string
  ): AsyncGenerator<StreamRecord[], void, unknown> {
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
