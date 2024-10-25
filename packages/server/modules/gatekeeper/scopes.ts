import { TokenScopeData } from '@/modules/shared/domain/rolesAndScopes/types'
import { Scopes } from '@speckle/shared'

export const gatekeeperScopes: TokenScopeData[] = [
  {
    name: Scopes.Gatekeeper.WorkspaceBilling,
    description: 'Scope for managing workspace billing',
    public: false
  }
]
