/* istanbul ignore file */
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

import {
  UserInputError,
  UnverifiedEmailSSOLoginError
} from '@/modules/core/errors/userinput'

import { ServerInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { getResourceTypeRole } from '@/modules/serverinvites/helpers/core'
import { AuthStrategyMetadata, AuthStrategyBuilder } from '@/modules/auth/helpers/types'
import {
  getGoogleClientId,
  getGoogleClientSecret
} from '@/modules/shared/helpers/envHelper'
import { ensureError, Optional } from '@speckle/shared'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'
import {
  FinalizeInvitedServerRegistration,
  ResolveAuthRedirectPath,
  ValidateServerInvite
} from '@/modules/serverinvites/services/operations'
import { PassportAuthenticateHandlerBuilder } from '@/modules/auth/domain/operations'
import {
  FindOrCreateValidatedUser,
  LegacyGetUserByEmail
} from '@/modules/core/domain/users/operations'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { EnvironmentResourceError } from '@/modules/shared/errors'
import { ExpectedAuthFailure } from '@/modules/auth/domain/const'

const googleStrategyBuilderFactory =
  (deps: {
    getServerInfo: GetServerInfo
    getUserByEmail: LegacyGetUserByEmail
    findOrCreateUser: FindOrCreateValidatedUser
    validateServerInvite: ValidateServerInvite
    finalizeInvitedServerRegistration: FinalizeInvitedServerRegistration
    resolveAuthRedirectPath: ResolveAuthRedirectPath
    passportAuthenticateHandlerBuilder: PassportAuthenticateHandlerBuilder
  }): AuthStrategyBuilder =>
  async (
    app,
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    finalizeAuthMiddleware
  ) => {
    const strategy: AuthStrategyMetadata & { callbackUrl: string } = {
      id: 'google',
      name: 'Google',
      icon: 'mdi-google',
      color: 'red darken-3',
      url: '/auth/goog',
      callbackUrl: '/auth/goog/callback'
    }

    const myStrategy = new GoogleStrategy(
      {
        clientID: getGoogleClientId(),
        clientSecret: getGoogleClientSecret(),
        callbackURL: strategy.callbackUrl,
        scope: ['profile', 'email'],
        passReqToCallback: true
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        const serverInfo = await deps.getServerInfo()
        const logger = req.log.child({
          authStrategy: 'google',
          profileId: profile.id,
          serverVersion: serverInfo.version
        })

        try {
          const email = profile.emails?.[0].value
          if (!email) {
            throw new EnvironmentResourceError('No email provided by Google')
          }

          const name = profile.displayName
          const user = { email, name, avatar: profile._json.picture }

          const existingUser = await deps.getUserByEmail({ email: user.email })

          if (existingUser && !existingUser.verified) {
            throw new UnverifiedEmailSSOLoginError(undefined, {
              info: {
                email: user.email
              }
            })
          }

          // if there is an existing user, go ahead and log them in (regardless of
          // whether the server is invite only or not).
          if (existingUser) {
            const myUser = await deps.findOrCreateUser({ user })
            return done(null, myUser)
          }

          // if the server is invite only and we have no invite id, throw.
          if (serverInfo.inviteOnly && !req.session.token) {
            throw new UserInputError(
              'This server is invite only. Please authenticate yourself through a valid invite link.'
            )
          }

          // validate the invite, if any
          let invite: Optional<ServerInviteRecord> = undefined
          if (req.session.token) {
            invite = await deps.validateServerInvite(user.email, req.session.token)
          }

          // create the user
          const myUser = await deps.findOrCreateUser({
            user: {
              ...user,
              role: invite
                ? getResourceTypeRole(invite.resource, ServerInviteResourceType)
                : undefined,
              verified: !!invite,
              signUpContext: {
                req,
                isInvite: !!invite,
                newsletterConsent: !!req.session.newsletterConsent
              }
            }
          })

          // use the invite
          await deps.finalizeInvitedServerRegistration(user.email, myUser.id)

          // Resolve redirect path
          req.authRedirectPath = deps.resolveAuthRedirectPath(invite)

          // return to the auth flow
          return done(null, {
            ...myUser,
            isInvite: !!invite
          })
        } catch (err) {
          const e = ensureError(
            err,
            'Unexpected issue occured while authenticating with Google'
          )
          switch (e.constructor.name) {
            case ExpectedAuthFailure.UserInputError:
            case ExpectedAuthFailure.InviteNotFoundError:
              logger.info({ err: e }, 'Auth error for Google strategy')
              // note; passportjs suggests err should be null for user input errors.
              // We also need to pass the error type in the info parameter
              // so `passportAuthenticationCallbackFactory` can handle redirects appropriately
              return done(null, false, {
                message: e.message,
                failureType: e.constructor.name as ExpectedAuthFailure
              })
            case ExpectedAuthFailure.UnverifiedEmailSSOLoginError:
              logger.info({ err: e }, 'Auth error for Google strategy')
              // note; passportjs suggests err should be null for user input errors.
              // We also need to pass the error type in the info parameter
              // so `passportAuthenticationCallbackFactory` can handle redirects appropriately
              return done(null, false, {
                message: e.message,
                failureType: e.constructor.name as ExpectedAuthFailure,
                email: (e as UnverifiedEmailSSOLoginError).info().email
              })
            default:
              // handle other common errors thrown by the underlying client libraries
              if (
                e.name === 'TokenError' &&
                'code' in e &&
                e.code === 'invalid_grant'
              ) {
                req.log.warn(
                  { err: e },
                  "Authentication error for strategy 'google' encountered an Invalid Grant error"
                )
                // This is a common error from Google and a number of reasons
                // can cause it. Many user-related issues, so we will treat it as user-related.
                // https://blog.timekit.io/google-oauth-invalid-grant-nightmare-and-how-to-fix-it-9f4efaf1da35
                return done(null, false, {
                  message: e.message,
                  failureType: ExpectedAuthFailure.InvalidGrantError
                })
              }

              logger.error({ err: e }, 'Auth error for Google strategy')
              return done(e, false, { message: e.message })
          }
        }
      }
    )

    passport.use(myStrategy)

    // 1. Init Auth
    app.get(
      strategy.url,
      sessionMiddleware,
      moveAuthParamsToSessionMiddleware,
      deps.passportAuthenticateHandlerBuilder('google')
    )

    // 2. Auth callback
    app.get(
      strategy.callbackUrl,
      sessionMiddleware,
      deps.passportAuthenticateHandlerBuilder('google'),
      finalizeAuthMiddleware
    )

    return strategy
  }

export = googleStrategyBuilderFactory
