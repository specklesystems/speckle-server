import type { StreamRecord } from '@/modules/core/helpers/types'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import type {
  GetDefaultRegion,
  GetWorkspaceDomains,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  GetWorkspaceSeatTypeToProjectRoleMapping,
  IntersectProjectCollaboratorsAndWorkspaceCollaborators,
  AddOrUpdateWorkspaceRole,
  ValidateWorkspaceMemberProjectRole,
  CopyWorkspace
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceInvalidProjectError,
  WorkspaceInvalidRoleError,
  WorkspaceNotFoundError
} from '@/modules/workspaces/errors/workspace'
import type {
  GetProject,
  UpdateProject
} from '@/modules/core/domain/projects/operations'
import { chunk } from 'lodash-es'
import type { WorkspaceRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import type {
  GetStreamCollaborators,
  UpdateStreamRole
} from '@/modules/core/domain/streams/operations'
import { ProjectNotFoundError } from '@/modules/core/errors/projects'
import type { WorkspaceProjectCreateInput } from '@/modules/core/graph/generated/graphql'
import {
  getDb,
  getValidDefaultProjectRegionKey
} from '@/modules/multiregion/utils/dbSelector'
import {
  createNewProjectFactory,
  waitForRegionProjectFactory
} from '@/modules/core/services/projects'
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
import type {
  GetWorkspaceRoleAndSeat,
  GetWorkspaceRolesAndSeats,
  GetWorkspaceWithPlan
} from '@/modules/gatekeeper/domain/billing'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import type { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import type { CreateWorkspaceSeat } from '@/modules/gatekeeper/domain/operations'
import type { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'

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
    copyWorkspace,
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
    copyWorkspace: CopyWorkspace
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

    // Ensure workspace record exists in source region
    await copyWorkspace({ workspaceId: workspace.id })

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

    // Override w/ planned
    if (workspaceAccess?.role) {
      workspaceRole = workspaceAccess.role
    }
    if (workspaceAccess?.seatType) {
      seatType = workspaceAccess.seatType
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
      storeModel: storeModelFactory({ db: projectDb }),
      // THIS MUST GO TO THE MAIN DB
      storeProjectRole: storeProjectRoleFactory({ db }),
      waitForRegionProject: waitForRegionProjectFactory({
        getProject: getProjectFactory({ db }),
        deleteProject: deleteProjectFactory({ db: projectDb })
      }),
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
