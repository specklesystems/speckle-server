/* istanbul ignore file */
import passport from 'passport'
import { Issuer, Strategy } from 'openid-client'
import { findOrCreateUser, getUserByEmail } from '@/modules/core/services/users'
import { getServerInfo } from '@/modules/core/services/generic'
import {
  validateServerInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} from '@/modules/serverinvites/services/processing'
import {
  getOidcDiscoveryUrl,
  getOidcClientId,
  getOidcClientSecret,
  getOidcName,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { passportAuthenticate } from '@/modules/auth/services/passportService'
import { UnverifiedEmailSSOLoginError } from '@/modules/core/errors/userinput'
import {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory,
  findServerInviteFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import db from '@/db/knex'
import { getNameFromUserInfo } from '@/modules/auth/helpers/oidc'
import { ServerInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { getResourceTypeRole } from '@/modules/serverinvites/helpers/core'
import { AuthStrategyBuilder } from '@/modules/auth/helpers/types'
import { get } from 'lodash'
import { Optional } from '@speckle/shared'
import { ServerInviteRecord } from '@/modules/serverinvites/domain/types'

const oidcStrategyBuilder: AuthStrategyBuilder = async (
  app,
  sessionMiddleware,
  moveAuthParamsToSessionMiddleware,
  finalizeAuthMiddleware
) => {
  const oidcIssuer = await Issuer.discover(getOidcDiscoveryUrl())
  const redirectUrl = new URL('/auth/oidc/callback', getServerOrigin()).toString()

  const client = new oidcIssuer.Client({
    // eslint-disable-next-line camelcase
    client_id: getOidcClientId(),
    // eslint-disable-next-line camelcase
    client_secret: getOidcClientSecret(),
    // eslint-disable-next-line camelcase
    redirect_uris: [redirectUrl],
    // eslint-disable-next-line camelcase
    response_types: ['code']
  })

  passport.use(
    'oidc',
    new Strategy<Express.User>(
      { client, passReqToCallback: true },
      async (req, tokenSet, userinfo, done) => {
        req.session.tokenSet = tokenSet
        req.session.userinfo = userinfo

        const serverInfo = await getServerInfo()
        const logger = req.log.child({
          authStrategy: 'oidc',
          serverVersion: serverInfo.version
        })

        // TODO: req.session.inviteId doesn't appear to exist, but i'm not removing it to not break things
        const token: Optional<string> =
          get(req.session, 'inviteId') || req.session.token

        try {
          const email = userinfo['email']
          if (!email) {
            throw new Error('No email provided by the OIDC provider.')
          }

          const name = getNameFromUserInfo(userinfo)

          const user = { email, name }

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
            const myUser = await findOrCreateUser({
              user
            })

            return done(null, myUser)
          }

          // if the server is invite only and we have no invite id, throw.
          if (serverInfo.inviteOnly && !token) {
            throw new Error('This server is invite only. Please provide an invite id.')
          }

          // validate the invite, if any
          let invite: Optional<ServerInviteRecord> = undefined
          if (token) {
            invite = await validateServerInviteFactory({
              findServerInvite: findServerInviteFactory({ db })
            })(user.email, token)
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
          logger.error(err)
          return done(err, undefined)
        }
      }
    )
  )

  // 1. Auth init
  app.get(
    '/auth/oidc',
    sessionMiddleware,
    moveAuthParamsToSessionMiddleware,
    passportAuthenticate('oidc', { scope: 'openid profile email' })
  )

  // 2. Auth finalize
  app.get(
    '/auth/oidc/callback',
    sessionMiddleware,
    passportAuthenticate('oidc', {
      failureRedirect: '/error?message=Failed to authenticate.'
    }),
    finalizeAuthMiddleware
  )

  return {
    id: 'oidc',
    name: getOidcName(),
    icon: 'mdi-badge-account-horizontal-outline',
    color: 'blue darken-3',
    url: '/auth/oidc',
    callbackUrl: new URL('/auth/oidc/callback', getServerOrigin()).toString()
  }
}

export = oidcStrategyBuilder
