/* istanbul ignore file */
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { findOrCreateUser, getUserByEmail } from '@/modules/core/services/users'
import { getServerInfo } from '@/modules/core/services/generic'
import {
  validateServerInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} from '@/modules/serverinvites/services/processing'
import { passportAuthenticate } from '@/modules/auth/services/passportService'
import {
  UserInputError,
  UnverifiedEmailSSOLoginError
} from '@/modules/core/errors/userinput'
import db from '@/db/knex'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findServerInviteFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { ServerInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { getResourceTypeRole } from '@/modules/serverinvites/helpers/core'
import { AuthStrategyMetadata, AuthStrategyBuilder } from '@/modules/auth/helpers/types'
import {
  getGoogleClientId,
  getGoogleClientSecret
} from '@/modules/shared/helpers/envHelper'
import { ensureError, Optional } from '@speckle/shared'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'

const googleStrategyBuilder: AuthStrategyBuilder = async (
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
      const serverInfo = await getServerInfo()
      const logger = req.log.child({
        authStrategy: 'google',
        profileId: profile.id,
        serverVersion: serverInfo.version
      })

      try {
        const email = profile.emails?.[0].value
        if (!email) {
          throw new Error('No email provided by Google')
        }

        const name = profile.displayName
        const user = { email, name, avatar: profile._json.picture }

        const existingUser = await getUserByEmail({ email: user.email })

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
          const myUser = await findOrCreateUser({ user })
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
          invite = await validateServerInviteFactory({
            findServerInvite: findServerInviteFactory({ db })
          })(user.email, req.session.token)
        }

        // create the user
        const myUser = await findOrCreateUser({
          user: {
            ...user,
            role: invite
              ? getResourceTypeRole(invite.resource, ServerInviteResourceType)
              : undefined,
            verified: !!invite
          }
        })

        // use the invite
        await finalizeInvitedServerRegistrationFactory({
          deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
          updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
        })(user.email, myUser.id)

        // Resolve redirect path
        req.authRedirectPath = resolveAuthRedirectPathFactory()(invite)

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
        switch (e.constructor) {
          case UserInputError:
            logger.info(err)
            break
          default:
            logger.error(err)
        }
        return done(err, false, { message: e.message })
      }
    }
  )

  passport.use(myStrategy)

  // 1. Init Auth
  app.get(
    strategy.url,
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    passportAuthenticate('google')
  )

  // 2. Auth callback
  app.get(
    strategy.callbackUrl,
    sessionMiddleware,
    passportAuthenticate('google'),
    finalizeAuthMiddleware
  )

  return strategy
}

export = googleStrategyBuilder
