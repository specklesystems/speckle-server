import passport, { Strategy, AuthenticateOptions } from 'passport'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  UnverifiedEmailSSOLoginError,
  UserInputError
} from '@/modules/core/errors/userinput'
import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { Optional } from '@speckle/shared'
import { get, isArray, isObjectLike, isString } from 'lodash'
import { PassportAuthenticateHandlerBuilder } from '@/modules/auth/domain/operations'

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

const passportAuthenticationCallbackFactory =
  (context: {
    strategy: Strategy | string
    req: Request
    res: Response
    next: NextFunction
  }) =>
  (
    err: unknown,
    user: Optional<Express.User>,
    info: Optional<string | Record<string, unknown> | Array<string | undefined>>
  ) => {
    const { strategy, req, res, next } = context
    if (err && !(err instanceof UserInputError))
      req.log.error({ err, strategy }, 'Authentication error for strategy "{strategy}"')

    if (!user) {
      const infoMsg = resolveInfoMessage(info)
      const errMsg = err instanceof UserInputError ? err.message : null
      const finalMessage =
        infoMsg ||
        errMsg ||
        (err
          ? 'An issue occurred during authentication, contact server admins'
          : 'Failed to authenticate, contact server admins')

      let errPath = `/error?message=${finalMessage}`

      if (err instanceof UnverifiedEmailSSOLoginError) {
        const email = err.info()?.email || ''
        errPath = `/error-email-verify?email=${email}`
      }

      res.redirect(new URL(errPath, getFrontendOrigin()).toString())
      return
    }

    req.user = user
    if (err && !(err instanceof UserInputError)) return next(err)
    next()
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
