import type { Strategy, AuthenticateOptions } from 'passport'
import passport from 'passport'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ensureError, type Optional, throwUncoveredError } from '@speckle/shared'
import { get, isArray, isObjectLike, isString } from 'lodash-es'
import type { PassportAuthenticateHandlerBuilder } from '@/modules/auth/domain/operations'
import { ExpectedAuthFailure } from '@/modules/auth/domain/const'
import type { ResolveAuthRedirectPath } from '@/modules/serverinvites/services/operations'

const resolveInfoMessage = (
  info?: Optional<string | Record<string, unknown> | Array<string | undefined>>
) => {
  if (!info) return null
  if (isString(info)) return info
  if (isArray(info)) {
    const arrayStrings = info.filter(isString)
    if (arrayStrings.length) return arrayStrings.join(', ')
  }
  if (isObjectLike(info)) {
    const message = get(info, 'message')
    if (isString(message)) return message
  }

  return null
}

const resolveFailureType = (
  info?: Optional<string | Record<string, unknown> | Array<string | undefined>>
) => {
  if (!info) return null
  if (isString(info)) return null
  if (isArray(info)) return null
  if (isObjectLike(info)) {
    const failureType = get(info, 'failureType')
    if (
      isString(failureType) &&
      Object.values(ExpectedAuthFailure).includes(failureType as ExpectedAuthFailure)
    ) {
      return failureType as ExpectedAuthFailure
    }
  }
  return null
}

const resolveEmail = (
  info?: Optional<string | Record<string, unknown> | Array<string | undefined>>
) => {
  if (!info) return ''
  if (isString(info)) return ''
  if (isArray(info)) return ''
  if (isObjectLike(info)) {
    const email = get(info, 'email')
    if (isString(email)) {
      return email
    }
  }
  return ''
}

const defaultErrorPath = (message: string) => `/error?message=${message}`
const unverifiedEmailPath = (email: string) => `/error-email-verify?email=${email}`

const buildRedirectUrl = (params: {
  resolveAuthRedirectPath: ResolveAuthRedirectPath
  path: string
}) => new URL(params.path, params.resolveAuthRedirectPath()).toString()

export const passportAuthenticationCallbackFactory =
  (context: {
    strategy: Strategy | string
    req: Request
    res: Response
    next: NextFunction
    resolveAuthRedirectPath: ResolveAuthRedirectPath
  }) =>
  (
    callbackError: unknown,
    user: Optional<Express.User>,
    info: Optional<string | Record<string, unknown> | Array<string | undefined>>
  ) => {
    const { strategy, req, res, next, resolveAuthRedirectPath } = context

    let e = callbackError
    let failureType = resolveFailureType(info)

    // WORKAROUND
    // passportjs states that 'verify' method of the strategy should not pass in
    // an error for user input problems.
    // Unfortunately openid-client <6.0.0 does not provide a third 'info' parameter
    // so we rely on user-input problems being passed to callback as errors.
    // This is a workaround until we upgrade to openid-client >=6.0.0
    if (e && strategy === 'oidc' && failureType === null) {
      switch (e.constructor.name) {
        case ExpectedAuthFailure.UserInputError:
        case ExpectedAuthFailure.InviteNotFoundError:
        case ExpectedAuthFailure.UnverifiedEmailSSOLoginError:
          // the error was being overloaded with user input problem information
          // so we need to extract it and set it as the info
          // and set the error to null
          failureType = e.constructor.name
          e = null
          break
        default:
          // what we have is an unexpected error, so nothing needs to change
          break
      }
    }

    if (e) {
      const err = ensureError(
        e,
        'Unknown authentication error. Please contact server admins'
      )

      // google will throw a TokenError for various reasons, such as invalid_grant, and the Google strategy will not call the verify method
      if (err.name === 'TokenError' && 'code' in err) {
        switch (err.code) {
          // invalid_grant is a common error from strategies such as Google and a number of reasons
          // can cause it. Many user-related issues, so we will treat it as user-related.
          // https://blog.timekit.io/google-oauth-invalid-grant-nightmare-and-how-to-fix-it-9f4efaf1da35
          case 'invalid_grant':
            req.log.warn(
              { err: e, strategy },
              'Authentication error for strategy "{strategy}" encountered an Invalid Grant error'
            )
            res.redirect(
              buildRedirectUrl({
                resolveAuthRedirectPath,
                path: defaultErrorPath(
                  'Failed to authenticate, please refer to your SSO provider.'
                )
              })
            )
            return
          default:
            req.log.info(
              // log at info level, as the error logging will be handled below
              { err, strategy },
              'Authentication error for strategy "{strategy}" encountered an unexpected TokenError of code "{err.code}"'
            )
          // fall through to the unknown error handler
        }
      }

      // unknown and unexpected error
      req.log.error({ err, strategy }, 'Authentication error for strategy "{strategy}"')
      return next(err)
    }

    if (user && failureType === null) {
      req.user = user
      // user authenticated successfully
      next()
      return
    }

    // no user, but no error either. This is expected in some cases (e.g. user input error)
    // in this case, we need to redirect the user to the correct page
    const infoMsg = resolveInfoMessage(info)
    switch (failureType) {
      case ExpectedAuthFailure.UserInputError:
      case ExpectedAuthFailure.InvalidGrantError:
        res.redirect(
          buildRedirectUrl({
            resolveAuthRedirectPath,
            path: defaultErrorPath(
              infoMsg ||
                'Failed to authenticate, please try again. Contact server admins if this is a persistent error.'
            )
          })
        )
        return
      case ExpectedAuthFailure.InviteNotFoundError:
        res.redirect(
          buildRedirectUrl({
            resolveAuthRedirectPath,
            path: defaultErrorPath(
              infoMsg ||
                'This server is invite only. The invite link may have expired or the invite may have been revoked. Please authenticate yourself through a valid invite link.'
            )
          })
        )
        return
      case ExpectedAuthFailure.UnverifiedEmailSSOLoginError:
        const email = resolveEmail(info)
        res.redirect(
          buildRedirectUrl({
            resolveAuthRedirectPath,
            path: unverifiedEmailPath(email)
          })
        )
        return
      case null:
        // unexpected error or missing info
        req.log.error(
          { info, authStrategy: strategy },
          "Authentication error for strategy '{authStrategy}' encountered an unexpected failure type or 'info' parameter is missing or invalid"
        )
        const message = infoMsg || 'Failed to authenticate, contact server admins'
        res.redirect(
          buildRedirectUrl({
            resolveAuthRedirectPath,
            path: defaultErrorPath(message)
          })
        )
        return
      default:
        throwUncoveredError(failureType)
    }
  }

/**
 * Wrapper for passport.authenticate that handles success & failure scenarios correctly
 * (passport.authenticate() by default doesn't, so don't use it)
 */
export const passportAuthenticateHandlerBuilderFactory =
  (deps: {
    resolveAuthRedirectPath: ResolveAuthRedirectPath
  }): PassportAuthenticateHandlerBuilder =>
  (
    strategy: Strategy | string,
    options: Optional<AuthenticateOptions> = undefined
  ): RequestHandler => {
    return (req, res, next) => {
      passport.authenticate(
        strategy,
        options || {},
        passportAuthenticationCallbackFactory({ ...deps, strategy, req, res, next })
      )(req, res, next)
    }
  }
