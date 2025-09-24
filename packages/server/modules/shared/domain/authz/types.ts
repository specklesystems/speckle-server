import type { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import type { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import type { BaseError } from '@/modules/shared/errors'
import type { Nullable, ServerRoles } from '@speckle/shared'

export interface AuthContext {
  auth: boolean
  userId?: string
  role?: ServerRoles
  tokenId?: string
  token?: string
  scopes?: string[]
  stream?: StreamWithOptionalRole
  project?: StreamWithOptionalRole
  err?: Error | BaseError
  /**
   * Set if authenticated with an app token
   */
  appId?: string | null
  /**
   * Set, if the token has resource access limits (e.g. only access to specific projects)
   */
  resourceAccessRules?: Nullable<TokenResourceIdentifier[]>
}

export interface AuthResult {
  authorized: boolean
}

export interface AuthParams {
  streamId?: string
  projectId?: string
}

export interface AuthData {
  context: AuthContext
  authResult: AuthResult
  params?: AuthParams
}

export type AuthPipelineFunction = ({
  context,
  authResult,
  params
}: AuthData) => Promise<AuthData>
