import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import {
  CreateWorkspaceSeat,
  GetWorkspaceUserSeat
} from '@/modules/gatekeeper/domain/operations'
import { NotFoundError } from '@/modules/shared/errors'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import {
  AssignWorkspaceSeat,
  EnsureValidWorkspaceRoleSeat,
  GetWorkspaceRoleForUser
} from '@/modules/workspaces/domain/operations'
import { InvalidWorkspaceSeatTypeError } from '@/modules/workspaces/errors/workspaceSeat'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import { z } from 'zod'

const getDefaultWorkspaceSeatTypeByWorkspaceRole = ({}: {
  workspaceRole: WorkspaceRoles
}): WorkspaceSeatType => {
  // this is here as part of a hotfix for old plans.
  return 'editor'
  // if (workspaceRole === Roles.Workspace.Admin) {
  // }
  // return 'viewer'
}

const WorkspaceRoleWorkspaceSeatTypeMapping = z.union([
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Admin),
    workspaceSeatType: z.literal('editor')
  }),
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Member),
    workspaceSeatType: z.union([z.literal('editor'), z.literal('viewer')])
  }),
  z.object({
    workspaceRole: z.literal(Roles.Workspace.Guest),
    workspaceSeatType: z.union([z.literal('editor'), z.literal('viewer')])
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
      type: getDefaultWorkspaceSeatTypeByWorkspaceRole({ workspaceRole: params.role })
    })

    await deps.eventEmit({
      eventName: WorkspaceEvents.SeatUpdated,
      payload: {
        seat,
        updatedByUserId: params.updatedByUserId
      }
    })

    return seat
  }

export const assignWorkspaceSeatFactory =
  ({
    createWorkspaceSeat,
    getWorkspaceRoleForUser,
    eventEmit: eventEmit
  }: {
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
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

    const seat = await createWorkspaceSeat({
      workspaceId,
      userId,
      type
    })

    await eventEmit({
      eventName: WorkspaceEvents.SeatUpdated,
      payload: {
        seat,
        updatedByUserId: assignedByUserId
      }
    })

    return seat
  }
