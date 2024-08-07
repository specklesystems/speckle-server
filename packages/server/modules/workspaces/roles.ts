import { UserWorkspaceRole } from '@/modules/shared/domain/rolesAndScopes/types'
import { Roles } from '@speckle/shared'

const aclTableName = 'workspace_acl'
const resourceTarget = 'workspaces'

export const workspaceRoles: UserWorkspaceRole[] = [
  {
    name: Roles.Workspace.Admin,
    description: 'Has root on the workspace',
    weight: 1000,
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: Roles.Workspace.Member,
    description: 'A regular member of the workspace',
    weight: 100,
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: Roles.Workspace.Guest,
    description: 'An external guest member of the workspace with limited rights',
    weight: 50,
    public: true,
    resourceTarget,
    aclTableName
  }
]
