import { UserWorkspaceRole } from '@/modules/shared/domain/rolesAndScopes/types'

const aclTableName = 'workspace_acl'
const resourceTarget = 'workspace'

export const workspaceRoles: UserWorkspaceRole[] = [
  {
    name: 'workspace:admin',
    description: 'Has root on the workspace',
    weight: 1000,
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: 'workspace:member',
    description: 'A regular member of the workspace',
    weight: 100,
    public: true,
    resourceTarget,
    aclTableName
  },
  {
    name: 'workspace:guest',
    description: 'An external guest member of the workspace with limited rights',
    weight: 50,
    public: true,
    resourceTarget,
    aclTableName
  }
]
