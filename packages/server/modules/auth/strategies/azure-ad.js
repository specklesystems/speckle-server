/* istanbul ignore file */
'use strict'

const passport = require('passport')
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy
const URL = require('url').URL
const debug = require('debug')
const { findOrCreateUser, getUserByEmail } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const { validateInvite, useInvite } = require('@/modules/serverinvites/services')

module.exports = async (app, session, sessionStorage, finalizeAuth) => {
  const strategy = new OIDCStrategy(
    {
      identityMetadata: process.env.AZURE_AD_IDENTITY_METADATA,
      clientID: process.env.AZURE_AD_CLIENT_ID,
      responseType: 'code id_token',
      responseMode: 'form_post',
      issuer: process.env.AZURE_AD_ISSUER,
      redirectUrl: new URL(
        '/auth/azure/callback',
        process.env.CANONICAL_URL
      ).toString(),
      allowHttpForRedirectUrl: true,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      scope: ['profile', 'email', 'openid'],
      loggingLevel: process.env.NODE_ENV === 'development' ? 'info' : 'error',
      passReqToCallback: true
    },
    async (req, iss, sub, profile, accessToken, refreshToken, done) => {
      done(null, profile)
    }
  )

  passport.use(strategy)

  app.get(
    '/auth/azure',
    session,
    sessionStorage,
    passport.authenticate('azuread-openidconnect', {
      failureRedirect: '/error?message=Failed to authenticate.'
    })
  )
  app.post(
    '/auth/azure/callback',
    session,
    passport.authenticate('azuread-openidconnect', {
      failureRedirect: '/error?message=Failed to authenticate.'
    }),
    async (req, res, next) => {
      const serverInfo = await getServerInfo()

      try {
        const user = {
          email: req.user._json.email,
          name: req.user._json.name || req.user.displayName
        }

        if (req.session.suuid) user.suuid = req.session.suuid

        const existingUser = await getUserByEmail({ email: user.email })

        if (existingUser && !existingUser.verified) {
          throw new Error(
            'Email already in use by a user with unverified email. Verify the email on the existing user to be able to log in with Azure'
          )
        }

        // if there is an existing user, go ahead and log them in (regardless of
        // whether the server is invite only or not).
        if (existingUser) {
          const myUser = await findOrCreateUser({
            user,
            rawProfile: req.user._json
          })
          // ID is used later for verifying access token
          req.user.id = myUser.id
          return next()
        }

        // if the server is not invite only, go ahead and log the user in.
        if (!serverInfo.inviteOnly) {
          const myUser = await findOrCreateUser({
            user,
            rawProfile: req.user._json
          })
          // ID is used later for verifying access token
          req.user.id = myUser.id
          return next()
        }

        // if the server is invite only and we have no invite id, throw.
        if (serverInfo.inviteOnly && !req.session.inviteId) {
          throw new Error('This server is invite only. Please provide an invite id.')
        }

        // validate the invite
        const validInvite = await validateInvite({
          id: req.session.inviteId,
          email: user.email
        })
        if (!validInvite) throw new Error('Invalid invite.')

        // create the user
        const myUser = await findOrCreateUser({ user, rawProfile: req.user._json })
        // ID is used later for verifying access token
        req.user.id = myUser.id

        // use the invite
        await useInvite({ id: req.session.inviteId, email: user.email })

        // return to the auth flow
        return next()
      } catch (err) {
        debug('speckle:errors')(err)
        return next()
      }
    },
    finalizeAuth
  )

  return {
    id: 'azuread',
    name: process.env.AZURE_AD_ORG_NAME || 'Microsoft',
    icon: 'mdi-microsoft',
    color: 'blue darken-3',
    url: '/auth/azure',
    callbackUrl: new URL('/auth/azure/callback', process.env.CANONICAL_URL).toString()
  }
}
