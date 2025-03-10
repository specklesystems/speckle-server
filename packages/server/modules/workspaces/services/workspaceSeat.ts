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

const getDefaultWorkspaceSeatTypeByWorkspaceRole = ({
  workspaceRole
}: {
  workspaceRole: WorkspaceRoles
}): WorkspaceSeatType => {
  if (workspaceRole === Roles.Workspace.Admin) {
    return 'editor'
  }
  return 'viewer'
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
    return await deps.createWorkspaceSeat({
      workspaceId: params.workspaceId,
      userId: params.userId,
      type: getDefaultWorkspaceSeatTypeByWorkspaceRole({ workspaceRole: params.role })
    })
  }

export const assignWorkspaceSeatFactory =
  ({
    createWorkspaceSeat,
    getWorkspaceRoleForUser,
    emit
  }: {
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
    emit: EventBusEmit
  }): AssignWorkspaceSeat =>
  async ({ workspaceId, userId, type }) => {
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

    await emit({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: { acl: workspaceAcl, seatType: seat.type }
    })

    return seat
  }
