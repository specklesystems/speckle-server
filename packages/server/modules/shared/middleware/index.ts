import {
  AuthContext,
  authPipelineCreator,
  AuthPipelineFunction,
  AuthParams,
  authHasFailed
} from '@/modules/shared/authz'
import { Request, Response, NextFunction } from 'express'
import { ForbiddenError, UnauthorizedError } from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { validateToken } from '@/modules/core/services/tokens'
import { TokenValidationResult } from '@/modules/core/helpers/types'
import { buildRequestLoaders } from '@/modules/core/loaders'
import {
  GraphQLContext,
  MaybeNullOrUndefined,
  Nullable
} from '@/modules/shared/helpers/typeHelper'
import { getUser } from '@/modules/core/repositories/users'
import { resolveMixpanelUserId } from '@speckle/shared'
import { mixpanel } from '@/modules/shared/utils/mixpanel'

export const authMiddlewareCreator = (steps: AuthPipelineFunction[]) => {
  const pipeline = authPipelineCreator(steps)

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    const { authResult } = await pipeline({
      context: req.context,
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

export const getTokenFromRequest = (req: Request | null | undefined): string | null =>
  req?.headers?.authorization ?? null

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
  // null, undefined or empty string tokens can continue without errors and auth: false
  // to enable anonymous user access to public resources
  if (!rawToken) return { auth: false }
  let token = rawToken
  if (token.startsWith('Bearer ')) token = token.split(' ')[1]

  try {
    const tokenValidationResult = await tokenValidator(token)
    // invalid tokens however will be rejected.
    if (!tokenValidationResult.valid)
      return { auth: false, err: new ForbiddenError('Your token is not valid.') }

    const { scopes, userId, role } = tokenValidationResult

    return { auth: true, userId, role, token, scopes }
  } catch (err) {
    const surelyError = ensureError(err, 'Unknown error during token validation')
    return { auth: false, err: surelyError }
  }
}

export async function authContextMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = getTokenFromRequest(req)
  const authContext = await createAuthContextFromToken(token)
  if (!authContext.auth && authContext.err) {
    let message = 'Unknown Auth context error'
    let status = 500
    message = authContext.err?.message || message
    if (authContext.err instanceof UnauthorizedError) status = 401
    if (authContext.err instanceof ForbiddenError) status = 403
    return res.status(status).json({ error: message })
  }
  req.context = authContext
  next()
}

export function addLoadersToCtx(ctx: AuthContext): GraphQLContext {
  const loaders = buildRequestLoaders(ctx)
  return { ...ctx, loaders }
}

/**
 * Build context for GQL operations
 */
export async function buildContext({
  req,
  token
}: {
  req: MaybeNullOrUndefined<Request>
  token: Nullable<string>
}): Promise<GraphQLContext> {
  const ctx =
    req?.context ||
    (await createAuthContextFromToken(token ?? getTokenFromRequest(req)))

  // Adding request data loaders
  return addLoadersToCtx(ctx)
}

/**
 * Adds a .mixpanel helper onto the req object that is already pre-identified with the active user's identity
 */
export async function mixpanelTrackerHelperMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const ctx = req.context
  const user = ctx.userId ? await getUser(ctx.userId) : null
  const mixpanelUserId = user?.email ? resolveMixpanelUserId(user.email) : undefined
  const mp = mixpanel({ mixpanelUserId })

  req.mixpanel = mp
  next()
}
