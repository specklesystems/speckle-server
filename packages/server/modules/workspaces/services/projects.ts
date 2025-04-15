import { StreamRecord } from '@/modules/core/helpers/types'
import {
  GetDefaultRegion,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  GetWorkspaceSeatTypeToProjectRoleMapping,
  QueryAllWorkspaceProjects,
  UpdateWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceInvalidProjectError,
  WorkspaceNotFoundError,
  WorkspaceQueryError
} from '@/modules/workspaces/errors/workspace'
import {
  GetProject,
  GetProjectCollaborators,
  UpdateProject,
  UpsertProjectRole
} from '@/modules/core/domain/projects/operations'
import { chunk, intersection } from 'lodash'
import { Roles, StreamRoles } from '@speckle/shared'
import { orderByWeight } from '@/modules/shared/domain/rolesAndScopes/logic'
import coreUserRoles from '@/modules/core/roles'
import {
  GetUserStreamsPage,
  LegacyGetStreams
} from '@/modules/core/domain/streams/operations'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'
import { WorkspaceProjectCreateInput } from '@/test/graphql/generated/graphql'
import {
  getDb,
  getValidDefaultProjectRegionKey
} from '@/modules/multiregion/utils/dbSelector'
import { createNewProjectFactory } from '@/modules/core/services/projects'
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { mainDb } from '@/db/knex'
import { storeModelFactory } from '@/modules/core/repositories/models'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getWorkspaceFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  GetWorkspaceRolesAndSeats,
  GetWorkspaceWithPlan,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { NotImplementedError } from '@/modules/shared/errors'

export const queryAllWorkspaceProjectsFactory = ({
  getStreams
}: {
  getStreams: LegacyGetStreams
}): QueryAllWorkspaceProjects =>
  async function* queryAllWorkspaceProjects({
    workspaceId,
    userId
  }): AsyncGenerator<StreamRecord[], void, unknown> {
    let cursor: Date | null = null
    let iterationCount = 0

    do {
      if (iterationCount > 500) throw new WorkspaceQueryError()

      const { streams, cursorDate } = await getStreams({
        cursor,
        orderBy: null,
        limit: 100,
        visibility: null,
        searchQuery: null,
        streamIdWhitelist: null,
        workspaceIdWhitelist: [workspaceId],
        userId
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
  movedByUserId: string
}

export const moveProjectToWorkspaceFactory =
  ({
    getProject,
    updateProject,
    upsertProjectRole,
    getProjectCollaborators,
    getWorkspaceRolesAndSeats,
    getWorkspaceRoleToDefaultProjectRoleMapping,
    updateWorkspaceRole,
    getWorkspaceWithPlan
  }: {
    getProject: GetProject
    updateProject: UpdateProject
    upsertProjectRole: UpsertProjectRole
    getProjectCollaborators: GetProjectCollaborators
    getWorkspaceRolesAndSeats: GetWorkspaceRolesAndSeats
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    updateWorkspaceRole: UpdateWorkspaceRole
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }) =>
  async ({
    projectId,
    workspaceId,
    movedByUserId
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
    const [workspace, projectTeam, workspaceTeam] = await Promise.all([
      getWorkspaceWithPlan({ workspaceId }),
      getProjectCollaborators({ projectId }),
      getWorkspaceRolesAndSeats({ workspaceId })
    ])
    if (!workspace) throw new WorkspaceNotFoundError()

    const isNewPlan = workspace.plan && isNewPlanType(workspace.plan.name)
    const roleMapping = isNewPlan
      ? undefined
      : await getWorkspaceRoleToDefaultProjectRoleMapping({
          workspaceId
        })

    for (const projectMembers of chunk(projectTeam, 5)) {
      await Promise.all(
        projectMembers.map(
          async ({ id: userId, role: serverRole, streamRole: currentProjectRole }) => {
            // Update workspace role. Prefer existing workspace role if there is one.
            const currentWorkspaceRole = workspaceTeam[userId]?.role

            const nextWorkspaceRole = currentWorkspaceRole
              ? currentWorkspaceRole
              : {
                  userId,
                  workspaceId,
                  role:
                    serverRole === Roles.Server.Guest
                      ? Roles.Workspace.Guest
                      : Roles.Workspace.Member,
                  createdAt: new Date()
                }

            await updateWorkspaceRole({
              ...nextWorkspaceRole,
              updatedByUserId: movedByUserId
            })

            // Upsert project role. Prefer default workspace project role if more permissive.
            // (Does not apply to new plans)
            if (isNewPlan) return

            const defaultProjectRole =
              roleMapping?.default[nextWorkspaceRole.role] ?? Roles.Stream.Reviewer
            const allowedProjectRoles =
              roleMapping?.allowed[nextWorkspaceRole.role] ?? []
            const rolePicks = intersection(
              [currentProjectRole, defaultProjectRole],
              allowedProjectRoles
            )
            const nextProjectRole = orderByWeight(rolePicks, coreUserRoles)[0]

            // TODO: Shouldn't this be the service call that also fires events?
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
    getWorkspaceWithPlan
  }: {
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }): GetWorkspaceRoleToDefaultProjectRoleMapping =>
  async ({ workspaceId }) => {
    const workspace = await getWorkspaceWithPlan({ workspaceId })

    if (!workspace) {
      throw new WorkspaceNotFoundError()
    }

    const isNewPlan = workspace.plan && isNewPlanType(workspace.plan.name)
    const allowed = {
      [Roles.Workspace.Guest]: [Roles.Stream.Reviewer, Roles.Stream.Contributor],
      [Roles.Workspace.Member]: [
        Roles.Stream.Reviewer,
        Roles.Stream.Contributor,
        Roles.Stream.Owner
      ],
      [Roles.Workspace.Admin]: [
        Roles.Stream.Reviewer,
        Roles.Stream.Contributor,
        Roles.Stream.Owner
      ]
    }

    if (isNewPlan)
      return {
        default: {
          [Roles.Workspace.Guest]: null,
          [Roles.Workspace.Member]: null,
          [Roles.Workspace.Admin]: null
        },
        allowed
      }

    return {
      default: {
        [Roles.Workspace.Guest]: null,
        [Roles.Workspace.Member]: Roles.Stream.Reviewer,
        [Roles.Workspace.Admin]: Roles.Stream.Owner
      },
      allowed
    }
  }

export const getWorkspaceSeatTypeToProjectRoleMappingFactory =
  (deps: {
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }): GetWorkspaceSeatTypeToProjectRoleMapping =>
  async (params: { workspaceId: string }) => {
    const { workspaceId } = params
    const workspace = await deps.getWorkspaceWithPlan({ workspaceId })

    if (!workspace) {
      throw new WorkspaceNotFoundError()
    }

    const isNewPlan = workspace.plan && isNewPlanType(workspace.plan.name)
    if (!isNewPlan) {
      throw new NotImplementedError(
        'This function is not supported for this workspace plan'
      )
    }

    return {
      allowed: {
        [WorkspaceSeatType.Viewer]: [Roles.Stream.Reviewer],
        [WorkspaceSeatType.Editor]: [
          Roles.Stream.Reviewer,
          Roles.Stream.Contributor,
          Roles.Stream.Owner
        ]
      },
      default: {
        [WorkspaceSeatType.Viewer]: Roles.Stream.Reviewer,
        [WorkspaceSeatType.Editor]: Roles.Stream.Reviewer
      }
    }
  }

export const createWorkspaceProjectFactory =
  (deps: { getDefaultRegion: GetDefaultRegion }) =>
  async (params: { input: WorkspaceProjectCreateInput; ownerId: string }) => {
    // yes, i know, this is not aligned with our current definition of a service, but this was already this way
    // we need to figure out a good pattern for these situations, where we can not figure out the DB-s up front
    // its also hard to add a unit test for this in the current setup...
    const { input, ownerId } = params
    const workspaceDefaultRegion = await deps.getDefaultRegion({
      workspaceId: input.workspaceId
    })
    const regionKey =
      workspaceDefaultRegion?.key ?? (await getValidDefaultProjectRegionKey())
    const projectDb = await getDb({ regionKey })
    const db = mainDb

    const regionalWorkspace = await getWorkspaceFactory({ db: projectDb })({
      workspaceId: input.workspaceId
    })

    if (!regionalWorkspace) {
      const workspace = await getWorkspaceFactory({ db })({
        workspaceId: input.workspaceId
      })
      if (!workspace) throw new WorkspaceNotFoundError()
      await upsertWorkspaceFactory({ db: projectDb })({ workspace })
    }

    // todo, use the command factory here, but for that, we need to migrate to the event bus
    // deps not injected to ensure proper DB injection
    const createNewProject = createNewProjectFactory({
      storeProject: storeProjectFactory({ db: projectDb }),
      getProject: getProjectFactory({ db }),
      deleteProject: deleteProjectFactory({ db: projectDb }),
      storeModel: storeModelFactory({ db: projectDb }),
      // THIS MUST GO TO THE MAIN DB
      storeProjectRole: storeProjectRoleFactory({ db }),
      emitEvent: getEventBus().emit
    })

    const project = await createNewProject({
      ...input,
      regionKey,
      ownerId
    })

    return project
  }
