import {
  AuthContext,
  authPipelineCreator,
  AuthPipelineFunction,
  AuthParams,
  authHasFailed
} from '@/modules/shared/authz'
import {
  Request,
  RequestHandler,
  raw as expressRawBodyParser,
  json as expressJsonBodyParser
} from 'express'
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
import { UserInputError } from '@/modules/core/errors/userinput'
import compression from 'compression'

export const authMiddlewareCreator = (
  steps: AuthPipelineFunction[]
): RequestHandler => {
  const pipeline = authPipelineCreator(steps)

  return async (req, res, next) => {
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

export const authContextMiddleware: RequestHandler = async (req, res, next) => {
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
  (deps: { getUser: GetUser }): RequestHandler =>
  async (req, _res, next) => {
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
export const determineClientIpAddressMiddleware: RequestHandler = async (
  req,
  _res,
  next
) => {
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
    } catch {
      req.headers[X_SPECKLE_CLIENT_IP_HEADER] = ip || 'ip-parse-error'
    }
  }
  next()
}

//TODO ideally these should be identified alongside the route handlers
const RAW_BODY_PATH_PREFIXES = ['/api/v1/billing/webhooks', '/api/thirdparty/gendo/']

export const requestBodyParsingMiddlewareFactory =
  (deps: { maximumRequestBodySizeMb: number }): RequestHandler =>
  async (req, res, next) => {
    const maxRequestBodySize = `${deps.maximumRequestBodySizeMb}mb`

    const nextWithWrappedError = (err: unknown) => {
      if (!err) {
        next()
        return
      }

      next(
        new UserInputError('Invalid request body', {
          cause: ensureError(err, 'Unknown error parsing request body')
        })
      )
      return
    }

    try {
      if (RAW_BODY_PATH_PREFIXES.some((p) => req.path.startsWith(p))) {
        expressRawBodyParser({ type: 'application/json', limit: maxRequestBodySize })(
          req,
          res,
          nextWithWrappedError
        )

        // expressRawBodyParser calls `next` internally, so we cannot call it again here
        return
      }

      //default
      expressJsonBodyParser({ limit: maxRequestBodySize })(
        req,
        res,
        nextWithWrappedError
      )

      // expressJsonBodyParser calls `next` internally, so we cannot call it again here
      return
    } catch (err) {
      // something blew up, so let's wrap it and pass it to the error handler
      const e = new UserInputError(
        'Error unexpectedly encountered when parsing the request body',
        {
          info: { cause: ensureError(err, 'Unknown error parsing request body') }
        }
      )
      next(e)
      return
    }
  }

export function compressionMiddlewareFactory(deps: {
  isCompressionEnabled: boolean
}): RequestHandler {
  if (deps.isCompressionEnabled) return compression()
  return (_req, _res, next) => next()
}

export const setContentSecurityPolicyHeaderMiddleware: RequestHandler = (
  _req,
  res,
  next
) => {
  if (res.headersSent) return next()
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'")
  next()
}
