import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import type {
  CreateWorkspaceSeat,
  GetWorkspaceDefaultSeatType,
  GetWorkspaceUserSeat
} from '@/modules/gatekeeper/domain/operations'
import { NotFoundError } from '@/modules/shared/errors'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type {
  AssignWorkspaceSeat,
  EnsureValidWorkspaceRoleSeat,
  GetWorkspace,
  GetWorkspaceRoleForUser
} from '@/modules/workspaces/domain/operations'
import { InvalidWorkspaceSeatTypeError } from '@/modules/workspaces/errors/workspaceSeat'
import { WorkspaceDefaultSeatType } from '@/modules/workspacesCore/domain/constants'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import type { WorkspaceRoles } from '@speckle/shared'
import { Roles } from '@speckle/shared'
import { z } from 'zod'

export const getWorkspaceDefaultSeatTypeFactory =
  (deps: { getWorkspace: GetWorkspace }): GetWorkspaceDefaultSeatType =>
  async ({ workspaceId, workspaceRole }) => {
    // Default configured on workspace. `null` if never set by workspace admin
    // Note: The unset state allows us to change the global default later on existing workspaces
    const workspace = await deps.getWorkspace({ workspaceId })
    const workspaceDefaultSeatType =
      workspace?.defaultSeatType ?? WorkspaceDefaultSeatType

    // Workspace admins require an editor seat
    return workspaceRole === Roles.Workspace.Admin
      ? WorkspaceSeatType.Editor
      : workspaceDefaultSeatType
  }

const WorkspaceRoleWorkspaceSeatTypeMapping = z.union([
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Admin),
    workspaceSeatType: z.literal(WorkspaceSeatType.Editor)
  }),
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Member),
    workspaceSeatType: z.union([
      z.literal(WorkspaceSeatType.Editor),
      z.literal(WorkspaceSeatType.Viewer)
    ])
  }),
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Guest),
    workspaceSeatType: z.union([
      z.literal(WorkspaceSeatType.Editor),
      z.literal(WorkspaceSeatType.Viewer)
    ])
  })
])

type WorkspaceRoleWorkspaceSeatTypeMapping = z.infer<
  typeof WorkspaceRoleWorkspaceSeatTypeMapping
>

export const isWorkspaceRoleWorkspaceSeatTypeValid = ({
  workspaceRole,
  workspaceSeatType
}: {
  workspaceRole: WorkspaceRoles
  workspaceSeatType: WorkspaceSeatType
}): boolean => {
  return WorkspaceRoleWorkspaceSeatTypeMapping.safeParse({
    workspaceRole,
    workspaceSeatType
  }).success
}

export const ensureValidWorkspaceRoleSeatFactory =
  (deps: {
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceUserSeat: GetWorkspaceUserSeat
    getWorkspaceDefaultSeatType: GetWorkspaceDefaultSeatType
    eventEmit: EventBusEmit
  }): EnsureValidWorkspaceRoleSeat =>
  async (params) => {
    const workspaceSeat = await deps.getWorkspaceUserSeat({
      workspaceId: params.workspaceId,
      userId: params.userId
    })
    if (
      workspaceSeat &&
      isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: params.role,
        workspaceSeatType: workspaceSeat.type
      })
    ) {
      return workspaceSeat
    }

    // Upsert default seat type assignment
    const seat = await deps.createWorkspaceSeat({
      workspaceId: params.workspaceId,
      userId: params.userId,
      type: await deps.getWorkspaceDefaultSeatType({
        workspaceId: params.workspaceId,
        workspaceRole: params.role
      })
    })

    await deps.eventEmit({
      eventName: WorkspaceEvents.SeatUpdated,
      payload: {
        seat,
        updatedByUserId: params.updatedByUserId,
        previousSeat: workspaceSeat
      }
    })

    return seat
  }

export const assignWorkspaceSeatFactory =
  ({
    createWorkspaceSeat,
    getWorkspaceRoleForUser,
    getWorkspaceUserSeat,
    eventEmit: eventEmit
  }: {
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
    getWorkspaceUserSeat: GetWorkspaceUserSeat
    eventEmit: EventBusEmit
  }): AssignWorkspaceSeat =>
  async ({ workspaceId, userId, type, assignedByUserId }) => {
    const workspaceAcl = await getWorkspaceRoleForUser({ workspaceId, userId })
    if (!workspaceAcl) {
      throw new NotFoundError('User does not have a role in the workspace')
    }

    if (
      !isWorkspaceRoleWorkspaceSeatTypeValid({
        workspaceRole: workspaceAcl.role,
        workspaceSeatType: type
      })
    ) {
      throw new InvalidWorkspaceSeatTypeError(
        `User with workspace role ${workspaceAcl.role} cannot have a seat of type ${type}`,
        {
          info: {
            workspaceId,
            userId
          }
        }
      )
    }

    const previousSeat = await getWorkspaceUserSeat({ workspaceId, userId })
    const seat = await createWorkspaceSeat({
      workspaceId,
      userId,
      type
    })

    await eventEmit({
      eventName: WorkspaceEvents.SeatUpdated,
      payload: {
        seat,
        updatedByUserId: assignedByUserId,
        previousSeat
      }
    })

    return seat
  }
