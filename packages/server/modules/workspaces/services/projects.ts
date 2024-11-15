import { StreamRecord } from '@/modules/core/helpers/types'
import {
  GetWorkspace,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  QueryAllWorkspaceProjects,
  UpdateWorkspaceProjectRole,
  UpdateWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceAdminError,
  WorkspaceInvalidProjectError,
  WorkspaceInvalidRoleError,
  WorkspaceNotFoundError,
  WorkspaceQueryError
} from '@/modules/workspaces/errors/workspace'
import {
  GetProject,
  GetProjectCollaborators,
  UpdateProject,
  UpsertProjectRole
} from '@/modules/core/domain/projects/operations'
import { chunk } from 'lodash'
import { Roles, StreamRoles } from '@speckle/shared'
import { orderByWeight } from '@/modules/shared/domain/rolesAndScopes/logic'
import coreUserRoles from '@/modules/core/roles'
import {
  GetStream,
  GetUserStreamsPage,
  LegacyGetStreams,
  UpdateStreamRole
} from '@/modules/core/domain/streams/operations'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'

export const queryAllWorkspaceProjectsFactory = ({
  getStreams
}: {
  getStreams: LegacyGetStreams
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
  ({ getStreams }: { getStreams: GetUserStreamsPage }) =>
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
    updateWorkspaceRole
  }: {
    getProject: GetProject
    updateProject: UpdateProject
    upsertProjectRole: UpsertProjectRole
    getProjectCollaborators: GetProjectCollaborators
    getWorkspaceRoles: GetWorkspaceRoles
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    updateWorkspaceRole: UpdateWorkspaceRole
  }) =>
  async ({
    projectId,
    workspaceId
  }: MoveProjectToWorkspaceArgs): Promise<StreamRecord> => {
    const project = await getProject({ projectId })

    if (!project) throw new ProjectNotFoundError()
    if (project.workspaceId?.length) {
      // We do not currently support moving projects between workspaces
      throw new WorkspaceInvalidProjectError(
        'Specified project already belongs to a workspace. Moving between workspaces is not yet supported.'
      )
    }

    // Update roles for current project members
    const projectTeam = await getProjectCollaborators({ projectId })
    const workspaceTeam = await getWorkspaceRoles({ workspaceId })
    const defaultProjectRoleMapping = await getWorkspaceRoleToDefaultProjectRoleMapping(
      { workspaceId }
    )

    for (const projectMembers of chunk(projectTeam, 5)) {
      await Promise.all(
        projectMembers.map(
          async ({ id: userId, role: serverRole, streamRole: currentProjectRole }) => {
            // Update workspace role. Prefer existing workspace role if there is one.
            const currentWorkspaceRole = workspaceTeam.find(
              (role) => role.userId === userId
            )
            const nextWorkspaceRole = currentWorkspaceRole ?? {
              userId,
              workspaceId,
              role:
                serverRole === Roles.Server.Guest
                  ? Roles.Workspace.Guest
                  : Roles.Workspace.Member,
              createdAt: new Date()
            }
            await updateWorkspaceRole(nextWorkspaceRole)

            // Update project role. Prefer default workspace project role if more permissive.
            const defaultProjectRole =
              defaultProjectRoleMapping[nextWorkspaceRole.role] ?? Roles.Stream.Reviewer
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

export const getWorkspaceRoleToDefaultProjectRoleMappingFactory =
  ({
    getWorkspace
  }: {
    getWorkspace: GetWorkspace
  }): GetWorkspaceRoleToDefaultProjectRoleMapping =>
  async ({ workspaceId }) => {
    const workspace = await getWorkspace({ workspaceId })

    if (!workspace) {
      throw new WorkspaceNotFoundError()
    }

    return {
      [Roles.Workspace.Guest]: null,
      [Roles.Workspace.Member]: workspace.defaultProjectRole,
      [Roles.Workspace.Admin]: Roles.Stream.Owner
    }
  }

export const updateWorkspaceProjectRoleFactory =
  ({
    getStream,
    getWorkspaceRoleForUser,
    updateStreamRoleAndNotify
  }: {
    getStream: GetStream
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
    updateStreamRoleAndNotify: UpdateStreamRole
  }): UpdateWorkspaceProjectRole =>
  async ({ role, updater }) => {
    const { workspaceId } = (await getStream({ streamId: role.projectId })) ?? {}
    if (!workspaceId) throw new WorkspaceInvalidProjectError()

    const currentWorkspaceRole = await getWorkspaceRoleForUser({
      workspaceId,
      userId: role.userId
    })

    if (currentWorkspaceRole?.role === Roles.Workspace.Admin) {
      // User is workspace admin and cannot have their project roles changed
      throw new WorkspaceAdminError()
    }

    if (
      currentWorkspaceRole?.role === Roles.Workspace.Guest &&
      role.role === Roles.Stream.Owner
    ) {
      // Workspace guests cannot be project owners
      throw new WorkspaceInvalidRoleError('Workspace guests cannot be project owners.')
    }

    return await updateStreamRoleAndNotify(
      role,
      updater.userId!,
      updater.resourceAccessRules
    )
  }
