import { TokenScopeData } from '@/modules/shared/domain/rolesAndScopes/types'
import { Scopes } from '@speckle/shared'

export const workspaceScopes: TokenScopeData[] = [
  {
    name: Scopes.Workspaces.Create,
    description: 'Required for the creation of a workspace',
    public: true
  },
  {
    name: Scopes.Workspaces.Update,
    description: 'Required for editing workspace information',
    public: true
  },
  {
    name: Scopes.Workspaces.Read,
    description: 'Required for reading workspace data',
    public: true
  },
  {
    name: Scopes.Workspaces.Delete,
    description: 'Required for deleting workspaces',
    public: true
  }
]
