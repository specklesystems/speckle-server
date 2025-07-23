import type { ServerAcl, StreamAcl } from '@/modules/core/dbSchema'
import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import type { AuthContext } from '@/modules/shared/domain/authz/types'
import type { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import type {
  AvailableRoles,
  MaybeNullOrUndefined,
  Optional,
  ServerRoles
} from '@speckle/shared'
import type { OperationTypeNode } from 'graphql'

export type GetUserAclRole = (params: {
  aclTableName: typeof ServerAcl.name | typeof StreamAcl.name | typeof WorkspaceAcl.name
  userId: string
  resourceId: string
}) => Promise<MaybeNullOrUndefined<AvailableRoles>>

export type GetUserServerRole = (params: {
  userId: string
}) => Promise<Optional<ServerRoles>>

export type ValidateScopes = (
  scopes: Optional<string[]>,
  scope: string
) => Promise<void>

export type AuthorizeResolver = (
  userId: MaybeNullOrUndefined<string>,
  resourceId: string,
  requiredRole: AvailableRoles,
  userResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>,
  operationType?: OperationTypeNode // This is needed to block write operations when user is server admin
) => Promise<void>

export type ValidateUserServerRole = (
  context: AuthContext,
  requiredRole: ServerRoles
) => Promise<true>
