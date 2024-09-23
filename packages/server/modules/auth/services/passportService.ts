import passport, { Strategy, AuthenticateOptions } from 'passport'
import { logger } from '@/logging/logging'
import { useNewFrontend, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import {
  UnverifiedEmailSSOLoginError,
  UserInputError
} from '@/modules/core/errors/userinput'
import type { Handler } from 'express'
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

/**
 * Wrapper for passport.authenticate that handles success & failure scenarios correctly
 * (passport.authenticate() by default doesn't, so don't use it)
 */
export const passportAuthenticateHandlerBuilderFactory =
  (): PassportAuthenticateHandlerBuilder =>
  (
    strategy: Strategy | string,
    options: Optional<AuthenticateOptions> = undefined
  ): Handler => {
    return (req, res, next) => {
      passport.authenticate(
        strategy,
        options || {},
        // Not sure why types aren't automatically picked up
        (
          err: unknown,
          user: Optional<Express.User>,
          info: Optional<string | Record<string, unknown> | Array<string | undefined>>
        ) => {
          if (err && !(err instanceof UserInputError)) logger.error(err)

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

            return useNewFrontend()
              ? res.redirect(new URL(errPath, getFrontendOrigin()).toString())
              : res.redirect(errPath)
          }

          req.user = user
          next()
        }
      )(req, res, next)
    }
  }
