import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { CreateWorkspaceSeat } from '@/modules/gatekeeper/domain/operations'
import { NotFoundError } from '@/modules/shared/errors'
import {
  AssignWorkspaceSeat,
  GetWorkspaceRoleForUser
} from '@/modules/workspaces/domain/operations'
import { InvalidWorkspaceSeatTypeError } from '@/modules/workspaces/errors/workspaceSeat'
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

export const assignWorkspaceSeatFactory =
  ({
    createWorkspaceSeat,
    getWorkspaceRoleForUser
  }: {
    createWorkspaceSeat: CreateWorkspaceSeat
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
  }): AssignWorkspaceSeat =>
  async ({ workspaceId, userId, type }) => {
    const workspaceAcl = await getWorkspaceRoleForUser({ workspaceId, userId })
    if (!workspaceAcl) {
      throw new NotFoundError('User does not have a role in the workspace')
    }
    if (!type) {
      return await createWorkspaceSeat({
        workspaceId,
        userId,
        type: type
          ? type
          : getDefaultWorkspaceSeatTypeByWorkspaceRole({
              workspaceRole: workspaceAcl.role
            })
      })
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

    return await createWorkspaceSeat({
      workspaceId,
      userId,
      type
    })
  }
