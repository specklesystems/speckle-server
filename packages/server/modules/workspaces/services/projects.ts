import { StreamRecord } from '@/modules/core/helpers/types'
import { getStreams as serviceGetStreams } from '@/modules/core/services/streams'
import { getUserStreams } from '@/modules/core/repositories/streams'
import { GetWorkspaceRoles, QueryAllWorkspaceProjects, UpsertWorkspaceRole } from '@/modules/workspaces/domain/operations'
import { WorkspaceQueryError, WorkspacesNotYetImplementedError } from '@/modules/workspaces/errors/workspace'
import { GetProject, GetProjectCollaborators, UpdateProject } from '@/modules/core/domain/projects/operations'
import { chunk } from 'lodash'
import { GetUser } from '@/modules/core/domain/users/operations'
import { Roles } from '@speckle/shared'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

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
    userId: string
  }
}

type GetWorkspaceProjectsReturnValue = {
  items: StreamRecord[]
  cursor: string | null
}

export const getWorkspaceProjectsFactory =
  ({ getStreams }: { getStreams: typeof getUserStreams }) =>
    async (
      args: GetWorkspaceProjectsArgs,
      opts: GetWorkspaceProjectsOptions
    ): Promise<GetWorkspaceProjectsReturnValue> => {
      const { streams, cursor } = await getStreams({
        cursor: opts.cursor,
        limit: opts.limit || 25,
        searchQuery: opts.filter?.search || undefined,
        workspaceId: args.workspaceId,
        userId: opts.filter.userId
      })

      return {
        items: streams,
        cursor
      }
    }

type MoveProjectToWorkspaceArgs = {
  projectId: string
  workspaceId: string
}

export const moveProjectToWorkspaceFactory =
  ({
    getProject,
    updateProject,
    getProjectCollaborators,
    getWorkspaceRoles,
    upsertWorkspaceRole
  }: {
    getProject: GetProject
    updateProject: UpdateProject,
    getProjectCollaborators: GetProjectCollaborators
    getWorkspaceRoles: GetWorkspaceRoles,
    upsertWorkspaceRole: UpsertWorkspaceRole
  }) =>
    async ({ projectId, workspaceId }: MoveProjectToWorkspaceArgs): Promise<StreamRecord> => {
      const project = await getProject({ projectId })

      if (project.workspaceId) {
        // We do not currently support moving projects between workspaces
        throw new WorkspacesNotYetImplementedError()
      }

      // Update workspace roles for project members
      const projectTeam = await getProjectCollaborators({ projectId })
      const workspaceTeam = await getWorkspaceRoles({ workspaceId })

      for (const projectMembers of chunk(projectTeam, 20)) {
        await Promise.all(projectMembers.map(({ id: userId, role: serverRole, streamRole: projectRole }) => async () => {
          const currentWorkspaceRole = workspaceTeam.find((role) => role.userId === userId)
          if (!!currentWorkspaceRole) {
            return
          }
          const nextWorkspaceRole: WorkspaceAcl = {
            userId,
            workspaceId,
            role: serverRole === Roles.Server.Guest ? Roles.Workspace.Guest : Roles.Workspace.Member,
            createdAt: new Date()
          }
          await upsertWorkspaceRole(nextWorkspaceRole)
          // TODO: Grant roles for existing workspace projects
        }))
      }

      // Update project workspace association
      return await updateProject({ projectUpdate: { id: projectId, workspaceId } })
    }
