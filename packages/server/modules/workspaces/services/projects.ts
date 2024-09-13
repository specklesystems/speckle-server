import { StreamRecord } from '@/modules/core/helpers/types'
import { getStreams as serviceGetStreams } from '@/modules/core/services/streams'
import { getUserStreams } from '@/modules/core/repositories/streams'
import {
  GetWorkspaceRoles,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  QueryAllWorkspaceProjects,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceQueryError,
  WorkspacesNotYetImplementedError
} from '@/modules/workspaces/errors/workspace'
import {
  GetProject,
  GetProjectCollaborators,
  UpdateProject,
  UpsertProjectRole
} from '@/modules/core/domain/projects/operations'
import { chunk, isUndefined } from 'lodash'
import { Roles, StreamRoles } from '@speckle/shared'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { orderByWeight } from '@/modules/shared/domain/rolesAndScopes/logic'
import coreUserRoles from '@/modules/core/roles'
import { EventBus } from '@/modules/shared/services/eventBus'

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
    upsertProjectRole,
    getProjectCollaborators,
    getWorkspaceRoles,
    getWorkspaceRoleToDefaultProjectRoleMapping,
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    getProject: GetProject
    updateProject: UpdateProject
    upsertProjectRole: UpsertProjectRole
    getProjectCollaborators: GetProjectCollaborators
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EventBus['emit']
  }) =>
  async ({
    projectId,
    workspaceId
  }: MoveProjectToWorkspaceArgs): Promise<StreamRecord> => {
    const project = await getProject({ projectId })

    if (!isUndefined(project.workspaceId)) {
      // We do not currently support moving projects between workspaces
      throw new WorkspacesNotYetImplementedError()
    }

    // Update roles for current project members
    const projectTeam = await getProjectCollaborators({ projectId })
    const workspaceTeam = await getWorkspaceRoles({ workspaceId })
    const defaultProjectRoleMapping = await getWorkspaceRoleToDefaultProjectRoleMapping(
      { workspaceId }
    )

    for (const projectMembers of chunk(projectTeam, 20)) {
      await Promise.all(
        projectMembers.map(
          ({ id: userId, role: serverRole, streamRole: currentProjectRole }) =>
            async () => {
              // Update workspace role. Prefer existing workspace role if there is one.
              const currentWorkspaceRole = workspaceTeam.find(
                (role) => role.userId === userId
              )
              const nextWorkspaceRole: WorkspaceAcl = {
                userId,
                workspaceId,
                role:
                  currentWorkspaceRole?.role ?? serverRole === Roles.Server.Guest
                    ? Roles.Workspace.Guest
                    : Roles.Workspace.Member,
                createdAt: currentWorkspaceRole?.createdAt ?? new Date()
              }

              await upsertWorkspaceRole(nextWorkspaceRole)
              await emitWorkspaceEvent({
                eventName: 'workspace.role-updated',
                payload: nextWorkspaceRole
              })

              // Update project role. Prefer default workspace project role if more permissive.
              const defaultProjectRole =
                defaultProjectRoleMapping[nextWorkspaceRole.role] ??
                Roles.Stream.Reviewer
              const nextProjectRole = orderByWeight(
                [currentProjectRole, defaultProjectRole],
                coreUserRoles
              )[0]
              await upsertProjectRole({
                userId,
                projectId,
                role: nextProjectRole.name as StreamRoles
              })
            }
        )
      )
    }

    // Assign project to workspace
    return await updateProject({ projectUpdate: { id: projectId, workspaceId } })
  }
