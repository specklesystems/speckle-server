import { ProjectRecordVisibility, StreamRecord } from '@/modules/core/helpers/types'
import {
  GetDefaultRegion,
  GetWorkspaceDomains,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  GetWorkspaceSeatTypeToProjectRoleMapping,
  IntersectProjectCollaboratorsAndWorkspaceCollaborators,
  QueryAllWorkspaceProjects,
  AddOrUpdateWorkspaceRole,
  ValidateWorkspaceMemberProjectRole
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceInvalidProjectError,
  WorkspaceInvalidRoleError,
  WorkspaceNotFoundError,
  WorkspaceQueryError
} from '@/modules/workspaces/errors/workspace'
import { GetProject, UpdateProject } from '@/modules/core/domain/projects/operations'
import { chunk } from 'lodash'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import {
  GetStreamCollaborators,
  LegacyGetStreams,
  UpdateStreamRole
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
  GetWorkspaceRoleAndSeat,
  GetWorkspaceRolesAndSeats,
  GetWorkspaceWithPlan,
  WorkspaceSeatType
} from '@/modules/gatekeeper/domain/billing'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import { CreateWorkspaceSeat } from '@/modules/gatekeeper/domain/operations'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

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

type MoveProjectToWorkspaceArgs = {
  projectId: string
  workspaceId: string
  movedByUserId: string
}

export const moveProjectToWorkspaceFactory =
  ({
    getProject,
    updateProject,
    updateProjectRole,
    getProjectCollaborators,
    getWorkspaceDomains,
    getWorkspaceRolesAndSeats,
    updateWorkspaceRole,
    createWorkspaceSeat,
    getWorkspaceWithPlan,
    getUserEmails
  }: {
    getProject: GetProject
    updateProject: UpdateProject
    updateProjectRole: UpdateStreamRole
    getProjectCollaborators: GetStreamCollaborators
    getWorkspaceDomains: GetWorkspaceDomains
    getWorkspaceRolesAndSeats: GetWorkspaceRolesAndSeats
    updateWorkspaceRole: AddOrUpdateWorkspaceRole
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceWithPlan: GetWorkspaceWithPlan
    getUserEmails: FindEmailsByUserId
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

    const [workspace, projectTeam, workspaceTeam] = await Promise.all([
      getWorkspaceWithPlan({ workspaceId }),
      getProjectCollaborators(projectId),
      getWorkspaceRolesAndSeats({ workspaceId })
    ])
    if (!workspace) throw new WorkspaceNotFoundError()

    for (const projectMembers of chunk(projectTeam, 5)) {
      await Promise.all(
        projectMembers.map(async ({ id: userId, streamRole: currentProjectRole }) => {
          // Grant new workspace roles and seats for users without them
          if (!workspaceTeam[userId]) {
            let isUserDomainCompliant = true

            // Check user against domain protection if enabled on the workspace
            if (workspace.domainBasedMembershipProtectionEnabled) {
              const workspaceDomains = await getWorkspaceDomains({
                workspaceIds: [workspace.id]
              })
              const userEmails = await getUserEmails({ userId })

              isUserDomainCompliant = userEmailsCompliantWithWorkspaceDomains({
                userEmails,
                workspaceDomains
              })
            }

            // Grant workspace role
            const workspaceRole: WorkspaceAcl = {
              userId,
              workspaceId,
              role: isUserDomainCompliant
                ? Roles.Workspace.Member
                : Roles.Workspace.Guest,
              createdAt: new Date()
            }

            await updateWorkspaceRole({
              ...workspaceRole,
              updatedByUserId: movedByUserId
            })

            // Grant viewer seat
            const workspaceSeat = await createWorkspaceSeat({
              userId,
              workspaceId,
              type: WorkspaceSeatType.Viewer
            })

            // Update workspace team in-memory
            workspaceTeam[userId] = {
              role: workspaceRole,
              seat: workspaceSeat,
              userId
            }
          }

          // Demote user if seat type does not allow current project role
          const requiresEditorSeat =
            currentProjectRole === Roles.Stream.Owner ||
            currentProjectRole === Roles.Stream.Contributor
          const hasEditorSeat =
            workspaceTeam[userId]?.seat?.type === WorkspaceSeatType.Editor

          if (requiresEditorSeat && !hasEditorSeat) {
            await updateProjectRole(
              {
                userId,
                projectId,
                role: Roles.Stream.Reviewer
              },
              movedByUserId,
              null
            )
          }
        })
      )
    }

    // Assign project to workspace
    return await updateProject({
      projectUpdate: {
        id: projectId,
        workspaceId,
        visibility:
          // Migrate from Private -> Workspace visibility
          project.visibility === ProjectRecordVisibility.Private
            ? ProjectRecordVisibility.Workspace
            : project.visibility
      }
    })
  }

export const getWorkspaceRoleToDefaultProjectRoleMappingFactory =
  (): GetWorkspaceRoleToDefaultProjectRoleMapping => async () => {
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

    return {
      default: {
        [Roles.Workspace.Guest]: null,
        [Roles.Workspace.Member]: null,
        [Roles.Workspace.Admin]: null
      },
      allowed
    }
  }

export const getWorkspaceSeatTypeToProjectRoleMappingFactory =
  (): GetWorkspaceSeatTypeToProjectRoleMapping => async () => {
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

/**
 * Validate that the specified workspace member can have the specified project role
 */
export const validateWorkspaceMemberProjectRoleFactory =
  (deps: {
    getWorkspaceRoleAndSeat: GetWorkspaceRoleAndSeat
    getWorkspaceWithPlan: GetWorkspaceWithPlan
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    getWorkspaceSeatTypeToProjectRoleMapping: GetWorkspaceSeatTypeToProjectRoleMapping
  }): ValidateWorkspaceMemberProjectRole =>
  async (params) => {
    const { workspaceId, userId, projectRole, workspaceAccess } = params

    let workspaceRole: WorkspaceRoles
    let seatType: WorkspaceSeatType

    if (workspaceAccess) {
      // Check planned workspace role/seat
      workspaceRole = workspaceAccess.role
      seatType = workspaceAccess.seatType
    } else {
      // Check real workspace role/seat
      const roleSeatParams = {
        workspaceId,
        userId
      }

      const [currentWorkspaceRoleAndSeat, workspace] = await Promise.all([
        deps.getWorkspaceRoleAndSeat(roleSeatParams),
        deps.getWorkspaceWithPlan({ workspaceId })
      ])

      if (!workspace || !currentWorkspaceRoleAndSeat?.role) return
      workspaceRole = currentWorkspaceRoleAndSeat.role.role
      seatType = currentWorkspaceRoleAndSeat.seat?.type || WorkspaceSeatType.Viewer
    }

    const workspaceAllowedRoles = (
      await deps.getWorkspaceRoleToDefaultProjectRoleMapping({
        workspaceId
      })
    ).allowed[workspaceRole]
    const seatAllowedRoles = (
      await deps.getWorkspaceSeatTypeToProjectRoleMapping({
        workspaceId
      })
    ).allowed[seatType]
    const allowedRoles = Array.from(
      new Set(workspaceAllowedRoles).intersection(new Set(seatAllowedRoles))
    )

    if (!allowedRoles.includes(projectRole)) {
      // User's workspace role does not allow the requested project role
      throw new WorkspaceInvalidRoleError(
        `User's workspace seat type '${seatType}' and workspace role '${workspaceRole}' does not allow project role '${projectRole}'.`
      )
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

export const getMoveProjectToWorkspaceDryRunFactory =
  (deps: {
    intersectProjectCollaboratorsAndWorkspaceCollaborators: IntersectProjectCollaboratorsAndWorkspaceCollaborators
  }) =>
  async (args: { projectId: string; workspaceId: string }) => {
    const addedToWorkspace =
      await deps.intersectProjectCollaboratorsAndWorkspaceCollaborators({
        projectId: args.projectId,
        workspaceId: args.workspaceId
      })

    return { addedToWorkspace }
  }
