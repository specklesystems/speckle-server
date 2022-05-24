/* istanbul ignore file */
'use strict'
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const debug = require('debug')
const { findOrCreateUser, getUserByEmail } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const { validateInvite, useInvite } = require('@/modules/serverinvites/services')

module.exports = async (app, session, sessionStorage, finalizeAuth) => {
  const strategy = {
    id: 'google',
    name: 'Google',
    icon: 'mdi-google',
    color: 'red darken-3',
    url: '/auth/goog',
    callbackUrl: '/auth/goog/callback'
  }

  const myStrategy = new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: strategy.callbackUrl,
      scope: ['profile', 'email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      const serverInfo = await getServerInfo()

      try {
        const email = profile.emails[0].value
        const name = profile.displayName

        const user = { email, name, avatar: profile._json.picture }

        if (req.session.suuid) user.suuid = req.session.suuid

        const existingUser = await getUserByEmail({ email: user.email })

        if (existingUser && !existingUser.verified) {
          throw new Error(
            'Email already in use by a user with unverified email. Verify the email on the existing user to be able to log in with Google'
          )
        }

        // if there is an existing user, go ahead and log them in (regardless of
        // whether the server is invite only or not).
        if (existingUser) {
          const myUser = await findOrCreateUser({ user, rawProfile: profile._raw })
          return done(null, myUser)
        }

        // if the server is not invite only, go ahead and log the user in.
        if (!serverInfo.inviteOnly) {
          const myUser = await findOrCreateUser({ user, rawProfile: profile._raw })
          return done(null, myUser)
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
        const myUser = await findOrCreateUser({ user, rawProfile: profile._raw })

        // use the invite
        await useInvite({ id: req.session.inviteId, email: user.email })

        // return to the auth flow
        return done(null, myUser)
      } catch (err) {
        debug('speckle:errors')(err)
        return done(null, false, { message: err.message })
      }
    }
  )

  passport.use(myStrategy)

  app.get(strategy.url, session, sessionStorage, passport.authenticate('google'))
  app.get(
    '/auth/goog/callback',
    session,
    passport.authenticate('google', {
      failureRedirect: '/error?message=Failed to authenticate.'
    }),
    finalizeAuth
  )

  return strategy
}
