/* istanbul ignore file */
'use strict'

const passport = require('passport')
const GithubStrategy = require('passport-github2')
const URL = require('url').URL
const debug = require('debug')
const { findOrCreateUser, getUserByEmail } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const { validateInvite, useInvite } = require('@/modules/serverinvites/services')

module.exports = async (app, session, sessionStorage, finalizeAuth) => {
  const strategy = {
    id: 'github',
    name: 'Github',
    icon: 'mdi-github',
    color: 'grey darken-3',
    url: '/auth/gh',
    callbackUrl: new URL('/auth/gh/callback', process.env.CANONICAL_URL).toString()
  }

  const myStrategy = new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: strategy.callbackUrl,
      scope: ['profile', 'user:email'],
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      const serverInfo = await getServerInfo()

      try {
        const email = profile.emails[0].value
        const name = profile.displayName || profile.username
        const bio = profile._json.bio

        const user = { email, name, bio }

        if (req.session.suuid) user.suuid = req.session.suuid

        const existingUser = await getUserByEmail({ email: user.email })

        if (existingUser && !existingUser.verified) {
          throw new Error(
            'Email already in use by a user with unverified email. Verify the email on the existing user to be able to log in with Github'
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

  app.get(strategy.url, session, sessionStorage, passport.authenticate('github'))
  app.get(
    '/auth/gh/callback',
    session,
    passport.authenticate('github', {
      failureRedirect: '/error?message=Failed to authenticate.'
    }),
    finalizeAuth
  )

  return strategy
}
