import {
  AuthContext,
  authPipelineCreator,
  AuthPipelineFunction,
  AuthParams,
  authHasFailed
} from '@/modules/shared/authz'
import express from 'express'
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { validateToken } from '@/modules/core/services/tokens'
import { TokenValidationResult } from '@/modules/core/helpers/types'
import { buildRequestLoaders } from '@/modules/core/loaders'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'

interface RequestWithAuthContext extends express.Request {
  context: AuthContext
}

export const authMiddlewareCreator = (steps: AuthPipelineFunction[]) => {
  const pipeline = authPipelineCreator(steps)

  const middleware = async (
    req: RequestWithAuthContext,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const { authResult } = await pipeline({
      context: req.context as AuthContext,
      params: req.params as AuthParams,
      authResult: { authorized: false }
    })
    if (!authResult.authorized) {
      let message = 'Unknown AuthZ error'
      let status = 500
      if (authHasFailed(authResult)) {
        message = authResult.error?.message || message
        if (authResult.error instanceof UnauthorizedError) status = 401
        if (authResult.error instanceof ForbiddenError) status = 403
      }
      return res.status(status).json({ error: message })
    }
    return next()
  }
  return middleware
}

export const getTokenFromRequest = (
  req: express.Request | null | undefined
): string | null => req?.headers?.authorization ?? null

/**
 * Create an AuthContext from a raw token value
 * @param rawToken
 * @param tokenValidator
 * @returns The resulting AuthContext object of the token validator
 */
export async function createAuthContextFromToken(
  rawToken: string | null,
  tokenValidator: (
    tokenString: string
  ) => Promise<TokenValidationResult> = validateToken
): Promise<AuthContext> {
  if (rawToken === null) return { auth: false }
  let token = rawToken
  if (token.startsWith('Bearer ')) token = token.split(' ')[1]

  try {
    const tokenValidationResult = await tokenValidator(token)
    if (!tokenValidationResult.valid) return { auth: false }

    const { scopes, userId, role } = tokenValidationResult

    return { auth: true, userId, role, token, scopes }
  } catch (err) {
    const surelyError = ensureError(err, 'Unknown error during token validation')
    return { auth: false, err: surelyError }
  }
}

export async function authContextMiddleware(
  req: express.Request,
  _res: express.Response,
  next: express.NextFunction
) {
  const token = getTokenFromRequest(req)
  const authContext = await createAuthContextFromToken(token)
  ;(req as RequestWithAuthContext).context = authContext
  next()
}

export function addLoadersToCtx(ctx: AuthContext): GraphQLContext {
  const loaders = buildRequestLoaders(ctx)
  return { ...ctx, loaders }
}
type MaybeAuthenticatedRequest =
  | express.Request
  | RequestWithAuthContext
  | null
  | undefined
const isRequestWithAuthContext = (
  req: MaybeAuthenticatedRequest
): req is RequestWithAuthContext =>
  req !== null && req !== undefined && 'context' in req
/**
 * Build context for GQL operations
 */
export async function buildContext({
  req,
  token
}: {
  req: MaybeAuthenticatedRequest
  token: string | null
}): Promise<GraphQLContext> {
  const ctx = isRequestWithAuthContext(req)
    ? req.context
    : await createAuthContextFromToken(token ?? getTokenFromRequest(req))

  // Adding request data loaders
  return addLoadersToCtx(ctx)
}
