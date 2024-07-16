import { StreamRecord } from '@/modules/core/helpers/types'
import { getStreams as repoGetStreams } from '@/modules/core/services/streams'

export const queryAllWorkspaceProjectsFactory = ({
  getStreams
}: {
  // TODO: Core service factory functions
  getStreams: typeof repoGetStreams
}) =>
  async function* queryAllWorkspaceProjects(
    workspaceId: string
  ): AsyncGenerator<StreamRecord, void, unknown> {
    let cursor: Date | null = null
    let iterationCount = 0

    do {
      if (iterationCount > 500) throw new Error()

      const { streams, cursorDate } = await getStreams({
        cursor,
        orderBy: null,
        limit: 1000,
        visibility: null,
        searchQuery: null,
        streamIdWhitelist: null,
        workspaceIdWhitelist: [workspaceId]
      })

      for (const stream of streams ?? []) {
        yield stream
      }

      cursor = cursorDate
      iterationCount++
    } while (!!cursor)
  }
