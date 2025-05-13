import passport, { Strategy, AuthenticateOptions } from 'passport'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  UnverifiedEmailSSOLoginError,
  UserInputError
} from '@/modules/core/errors/userinput'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ensureError, Optional } from '@speckle/shared'
import { get, isArray, isObjectLike, isString } from 'lodash'
import { PassportAuthenticateHandlerBuilder } from '@/modules/auth/domain/operations'
import { InviteNotFoundError } from '@/modules/serverinvites/errors'

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

const defaultErrorPath = (message: string) => `/error?message=${message}`
const unverifiedEmailPath = (email: string) => `/error-email-verify?email=${email}`

export const passportAuthenticationCallbackFactory =
  (context: {
    strategy: Strategy | string
    req: Request
    res: Response
    next: NextFunction
  }) =>
  (
    e: unknown,
    user: Optional<Express.User>,
    info: Optional<string | Record<string, unknown> | Array<string | undefined>>
  ) => {
    const { strategy, req, res, next } = context

    if (user && !e) {
      // user authenticated successfully
      next()
      return
    }

    const infoMsg = resolveInfoMessage(info)
    if (!user && !e) {
      // no user despite there being no error, so authentication failed
      const message = infoMsg || 'Failed to authenticate, contact server admins'
      res.redirect(new URL(defaultErrorPath(message), getFrontendOrigin()).toString())
      return
    }

    const err = ensureError(
      e,
      'Unknown authentication error. Please contact server admins'
    )
    switch (err.constructor) {
      case UserInputError:
      case InviteNotFoundError:
        const message = infoMsg || err.message
        res.redirect(new URL(defaultErrorPath(message), getFrontendOrigin()).toString())
        return
      case UnverifiedEmailSSOLoginError:
        const email = (err as UnverifiedEmailSSOLoginError).info()?.email || ''
        res.redirect(
          new URL(unverifiedEmailPath(email), getFrontendOrigin()).toString()
        )
        return
      default:
        req.log.error(
          { err, strategy },
          'Authentication error for strategy "{strategy}"'
        )
        return next(err)
      // throwUncoveredError(err) //TODO at some point in the future, ideally change error handling to use this
    }
  }

/**
 * Wrapper for passport.authenticate that handles success & failure scenarios correctly
 * (passport.authenticate() by default doesn't, so don't use it)
 */
export const passportAuthenticateHandlerBuilderFactory =
  (): PassportAuthenticateHandlerBuilder =>
  (
    strategy: Strategy | string,
    options: Optional<AuthenticateOptions> = undefined
  ): RequestHandler => {
    return (req, res, next) => {
      passport.authenticate(
        strategy,
        options || {},
        passportAuthenticationCallbackFactory({ strategy, req, res, next })
      )(req, res, next)
    }
  }
