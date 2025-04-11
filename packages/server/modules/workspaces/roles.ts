import { UserWorkspaceRole } from '@/modules/shared/domain/rolesAndScopes/types'
import { Roles, RoleInfo } from '@speckle/shared'
import { pick } from 'lodash'

const aclTableName = 'workspace_acl'
const resourceTarget = 'workspaces'

const keysToPick = ['weight', 'description'] as const

export const workspaceRoles: UserWorkspaceRole[] = [
  {
    name: Roles.Workspace.Admin,
    ...pick(RoleInfo.Workspace[Roles.Workspace.Admin], keysToPick),
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: Roles.Workspace.Member,
    ...pick(RoleInfo.Workspace[Roles.Workspace.Member], keysToPick),
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: Roles.Workspace.Guest,
    ...pick(RoleInfo.Workspace[Roles.Workspace.Guest], keysToPick),
    public: true,
    resourceTarget,
    aclTableName
  }
]
