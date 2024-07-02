/* istanbul ignore file */
'use strict'

const passport = require('passport')
const { Issuer, Strategy } = require('openid-client')
const URL = require('url').URL
const { findOrCreateUser, getUserByEmail } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const {
  validateServerInvite,
  finalizeInvitedServerRegistrationFactory,
  resolveAuthRedirectPathFactory
} = require('@/modules/serverinvites/services/inviteProcessingService')
const { logger } = require('@/logging/logging')
const {
  getOidcDiscoveryUrl,
  getBaseUrl,
  getOidcClientId,
  getOidcClientSecret,
  getOidcName
} = require('@/modules/shared/helpers/envHelper')
const { passportAuthenticate } = require('@/modules/auth/services/passportService')
const { UnverifiedEmailSSOLoginError } = require('@/modules/core/errors/userinput')
const {
  deleteServerOnlyInvitesFactory,
  updateAllInviteTargetsFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const db = require('@/db/knex')
const { getNameFromUserInfo } = require('@/modules/auth/domain/logic')

module.exports = async (app, session, sessionStorage, finalizeAuth) => {
  const oidcIssuer = await Issuer.discover(getOidcDiscoveryUrl())
  const redirectUrl = new URL('/auth/oidc/callback', getBaseUrl()).toString()

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
    new Strategy(
      { client, passReqToCallback: true },
      async (req, tokenSet, userinfo, done) => {
        req.session.tokenSet = tokenSet
        req.session.userinfo = userinfo

        const serverInfo = await getServerInfo()

        try {
          const email = userinfo['email']
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
              user,
              rawProfile: userinfo
            })

            return done(null, myUser)
          }

          // if the server is not invite only, go ahead and log the user in.
          if (!serverInfo.inviteOnly) {
            const myUser = await findOrCreateUser({
              user,
              rawProfile: userinfo
            })

            // process invites
            if (myUser.isNewUser) {
              await finalizeInvitedServerRegistrationFactory({
                deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
                updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
              })(user.email, myUser.id)
            }
            return done(null, myUser)
          }

          // if the server is invite only and we have no invite id, throw.
          if (serverInfo.inviteOnly && !req.session.inviteId) {
            throw new Error('This server is invite only. Please provide an invite id.')
          }

          // validate the invite
          const validInvite = await validateServerInvite(
            user.email,
            req.session.inviteId
          )

          // create the user
          const myUser = await findOrCreateUser({
            user: {
              ...user,
              role: validInvite?.serverRole
            },
            rawProfile: userinfo
          })

          await finalizeInvitedServerRegistrationFactory({
            deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
            updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
          })(user.email, myUser.id)

          // Resolve redirect path
          req.authRedirectPath = resolveAuthRedirectPathFactory()(validInvite)

          // return to the auth flow
          return done(null, {
            ...myUser,
            isInvite: !!validInvite
          })
        } catch (err) {
          logger.error(err)
          return done(err, false, { message: err.message })
        }
      }
    )
  )

  app.get(
    '/auth/oidc',
    session,
    sessionStorage,
    passportAuthenticate('oidc', { scope: 'openid profile email' })
  )
  app.get(
    '/auth/oidc/callback',
    session,
    passportAuthenticate('oidc', {
      failureRedirect: '/error?message=Failed to authenticate.'
    }),
    finalizeAuth
  )

  return {
    id: 'oidc',
    name: getOidcName(),
    icon: 'mdi-badge-account-horizontal-outline',
    color: 'blue darken-3',
    url: '/auth/oidc',
    callbackUrl: new URL('/auth/oidc/callback', getBaseUrl()).toString()
  }
}
