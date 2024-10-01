import { ServerAcl, StreamAcl } from '@/modules/core/dbSchema'
import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { AuthContext } from '@/modules/shared/domain/authz/types'
import { WorkspaceAcl } from '@/modules/workspacesCore/helpers/db'
import {
  AvailableRoles,
  MaybeNullOrUndefined,
  Optional,
  ServerRoles
} from '@speckle/shared'

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
  userResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
) => Promise<void>

export type ValidateUserServerRole = (
  context: AuthContext,
  requiredRole: ServerRoles
) => Promise<true>
