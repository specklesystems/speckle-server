import { StreamRecord } from '@/modules/core/helpers/types'
import { getUserStreams as repoGetUserStreams } from '@/modules/core/repositories/streams'
import { GetAllWorkspaceProjectsForUser } from '@/modules/workspaces/domain/operations'

/**
 * TODO: Because of the way we implicitly grant project roles for users in a workspace,
 * this is equivalent to "get all workspace projects." We may need a new repo function if we ever
 * need to get workspace projects in a context where we don't have a user id available.
 */
export const getAllWorkspaceProjectsForUserFactory =
  ({
    getUserStreams
  }: {
    getUserStreams: typeof repoGetUserStreams
  }): GetAllWorkspaceProjectsForUser =>
  async ({ userId, workspaceId }) => {
    let cursor: string | undefined = undefined
    const projects: StreamRecord[] = []

    do {
      const { streams: workspaceProjects, cursor: pageCursor } = await getUserStreams({
        userId,
        workspaceIdWhitelist: [workspaceId],
        cursor
      })
      projects.push(...workspaceProjects)
      cursor = pageCursor ?? undefined
    } while (!!cursor)

    return projects
  }
