import {
  AuthContext,
  authPipelineCreator,
  AuthPipelineFunction,
  AuthParams,
  authHasFailed
} from '@/modules/shared/authz'
import { Request, Response, NextFunction, Handler } from 'express'
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError
} from '@/modules/shared/errors'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import { TokenValidationResult } from '@/modules/core/helpers/types'
import { buildRequestLoaders } from '@/modules/core/loaders'
import {
  GraphQLContext,
  MaybeNullOrUndefined,
  Nullable
} from '@/modules/shared/helpers/typeHelper'
import { Optional, wait } from '@speckle/shared'
import { mixpanel } from '@/modules/shared/utils/mixpanel'
import * as Observability from '@speckle/shared/dist/commonjs/observability/index.js'
import { pino } from 'pino'
import { getIpFromRequest } from '@/modules/shared/utils/ip'
import { Netmask } from 'netmask'
import { Merge } from 'type-fest'
import { resourceAccessRuleToIdentifier } from '@/modules/core/helpers/token'
import { delayGraphqlResponsesBy } from '@/modules/shared/helpers/envHelper'
import { subscriptionLogger } from '@/logging/logging'
import { GetUser } from '@/modules/core/domain/users/operations'
import { validateTokenFactory } from '@/modules/core/services/tokens'
import {
  getApiTokenByIdFactory,
  getTokenResourceAccessDefinitionsByIdFactory,
  getTokenScopesByIdFactory,
  revokeUserTokenByIdFactory,
  updateApiTokenFactory
} from '@/modules/core/repositories/tokens'
import { db } from '@/db/knex'
import { getTokenAppInfoFactory } from '@/modules/auth/repositories/apps'
import { getUserRoleFactory } from '@/modules/core/repositories/users'

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
        if (authResult.error instanceof NotFoundError) status = 404
      }
      return res.status(status).json({ error: message })
    }
    return next()
  }
  return middleware
}

export const getTokenFromRequest = (req: Request | null | undefined): string | null => {
  const removeBearerPrefix = (token: string) => token.replace('Bearer ', '')

  const fromHeader = req?.headers?.authorization || null
  if (fromHeader?.length) return removeBearerPrefix(fromHeader)

  const fromCookie = (req?.cookies?.authn as Nullable<string>) || null
  if (fromCookie?.length) return removeBearerPrefix(fromCookie)

  return null
}

/**
 * Create an AuthContext from a raw token value
 * @param rawToken
 * @param tokenValidator
 * @returns The resulting AuthContext object of the token validator
 */
export async function createAuthContextFromToken(
  rawToken: string | null,
  tokenValidator: (tokenString: string) => Promise<TokenValidationResult>
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

    const { scopes, userId, role, appId, resourceAccessRules } = tokenValidationResult

    return {
      auth: true,
      userId,
      role,
      token,
      scopes,
      appId,
      resourceAccessRules: resourceAccessRules
        ? resourceAccessRules.map(resourceAccessRuleToIdentifier)
        : null
    }
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
  const validateToken = validateTokenFactory({
    revokeUserTokenById: revokeUserTokenByIdFactory({ db }),
    getApiTokenById: getApiTokenByIdFactory({ db }),
    getTokenAppInfo: getTokenAppInfoFactory({ db }),
    getTokenScopesById: getTokenScopesByIdFactory({ db }),
    getUserRole: getUserRoleFactory({ db }),
    getTokenResourceAccessDefinitionsById: getTokenResourceAccessDefinitionsByIdFactory(
      {
        db
      }
    ),
    updateApiToken: updateApiTokenFactory({ db })
  })

  const token = getTokenFromRequest(req)
  const authContext = await createAuthContextFromToken(token, validateToken)
  const loggedContext = Object.fromEntries(
    Object.entries(authContext).filter(
      ([key]) => !['token'].includes(key.toLocaleLowerCase())
    )
  )
  req.log = req.log.child({ authContext: loggedContext })
  if (!authContext.auth && authContext.err) {
    let message = 'Unknown Auth context error'
    let status = 500
    if (authContext.err instanceof UnauthorizedError) {
      status = 401
      message = authContext.err?.message || message
    }
    if (authContext.err instanceof ForbiddenError) {
      status = 403
      message = authContext.err?.message || message
    }
    if (status === 500) req.log.error({ err: authContext.err }, 'Auth context error')
    return res.status(status).json({ error: message })
  }
  req.context = authContext
  next()
}

export async function addLoadersToCtx(
  ctx: Merge<Omit<GraphQLContext, 'loaders'>, { log?: Optional<pino.Logger> }>,
  options?: Partial<{ cleanLoadersEarly: boolean }>
): Promise<GraphQLContext> {
  const log =
    ctx.log || Observability.extendLoggerComponent(Observability.getLogger(), 'graphql')
  const loaders = await buildRequestLoaders(ctx, options)
  return { ...ctx, loaders, log }
}

/**
 * Build context for GQL operations
 */
export async function buildContext({
  req,
  token,
  cleanLoadersEarly
}: {
  req: MaybeNullOrUndefined<Request>
  token?: Nullable<string>
  cleanLoadersEarly?: boolean
}): Promise<GraphQLContext> {
  const validateToken = validateTokenFactory({
    revokeUserTokenById: revokeUserTokenByIdFactory({ db }),
    getApiTokenById: getApiTokenByIdFactory({ db }),
    getTokenAppInfo: getTokenAppInfoFactory({ db }),
    getTokenScopesById: getTokenScopesByIdFactory({ db }),
    getUserRole: getUserRoleFactory({ db }),
    getTokenResourceAccessDefinitionsById: getTokenResourceAccessDefinitionsByIdFactory(
      {
        db
      }
    ),
    updateApiToken: updateApiTokenFactory({ db })
  })

  const ctx =
    req?.context ||
    (await createAuthContextFromToken(token ?? getTokenFromRequest(req), validateToken))

  const log = Observability.extendLoggerComponent(
    req?.log || subscriptionLogger,
    'graphql'
  )

  const delay = delayGraphqlResponsesBy()
  if (delay > 0) {
    log.info({ delay }, 'Delaying GraphQL response by {delay}ms')
    await wait(delay)
  }

  // Adding request data loaders
  return await addLoadersToCtx(
    {
      ...ctx,
      log
    },
    { cleanLoadersEarly }
  )
}

/**
 * Adds a .mixpanel helper onto the req object that is already pre-identified with the active user's identity
 */
export const mixpanelTrackerHelperMiddlewareFactory =
  (deps: { getUser: GetUser }): Handler =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const ctx = req.context
    const user = ctx.userId ? await deps.getUser(ctx.userId) : null
    const mp = mixpanel({ userEmail: user?.email, req })

    req.mixpanel = mp
    next()
  }

const X_SPECKLE_CLIENT_IP_HEADER = 'x-speckle-client-ip'
/**
 * Determine the IP address of the request source and add it as a header to the request object.
 * This is used to correlate anonymous/unauthenticated requests with external data sources.
 * @param req HTTP request object
 * @param _res HTTP response object
 * @param next Express middleware-compatible next function
 */
export async function determineClientIpAddressMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const ip = getIpFromRequest(req)
  if (ip) {
    try {
      const isV6 = ip.includes(':')
      if (isV6) {
        req.headers[X_SPECKLE_CLIENT_IP_HEADER] = ip
      } else {
        const mask = new Netmask(`${ip}/24`)
        req.headers[X_SPECKLE_CLIENT_IP_HEADER] = mask.broadcast
      }
    } catch (e) {
      req.headers[X_SPECKLE_CLIENT_IP_HEADER] = ip || 'ip-parse-error'
    }
  }
  next()
}
