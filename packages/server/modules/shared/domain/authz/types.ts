import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { BaseError } from '@/modules/shared/errors'
import { Nullable, ServerRoles } from '@speckle/shared'

export interface AuthContext {
  auth: boolean
  userId?: string
  role?: ServerRoles
  token?: string
  scopes?: string[]
  stream?: StreamWithOptionalRole
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
  automationId?: string
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
