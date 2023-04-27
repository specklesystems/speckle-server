/* istanbul ignore file */
'use strict'

const passport = require('passport')
const GithubStrategy = require('passport-github2')
const URL = require('url').URL
const { findOrCreateUser, getUserByEmail } = require('@/modules/core/services/users')
const { getServerInfo } = require('@/modules/core/services/generic')
const {
  validateServerInvite,
  finalizeInvitedServerRegistration,
  resolveAuthRedirectPath
} = require('@/modules/serverinvites/services/inviteProcessingService')
const { passportAuthenticate } = require('@/modules/auth/services/passportService')
const { logger } = require('@/logging/logging')
const { UserInputError } = require('@/modules/core/errors/userinput')

module.exports = async (app, session, sessionStorage, finalizeAuth) => {
  const strategy = {
    id: 'github',
    name: 'Github',
    icon: 'mdi-github',
    color: 'grey darken-3',
    url: '/auth/gh',
    callbackUrl: '/auth/gh/callback'
  }

  const myStrategy = new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: new URL(strategy.callbackUrl, process.env.CANONICAL_URL).toString(),
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

        const existingUser = await getUserByEmail({ email: user.email })

        if (existingUser && !existingUser.verified) {
          throw new UserInputError(
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

          // process invites
          if (myUser.isNewUser) {
            await finalizeInvitedServerRegistration(user.email, myUser.id)
          }

          return done(null, myUser)
        }

        // if the server is invite only and we have no invite id, throw.
        if (serverInfo.inviteOnly && !req.session.token) {
          throw new UserInputError(
            'This server is invite only. Please authenticate yourself through a valid invite link.'
          )
        }

        // validate the invite
        const validInvite = await validateServerInvite(user.email, req.session.token)

        // create the user
        const myUser = await findOrCreateUser({ user, rawProfile: profile._raw })

        // use the invite
        await finalizeInvitedServerRegistration(user.email, myUser.id)

        // Resolve redirect path
        req.authRedirectPath = resolveAuthRedirectPath(validInvite)

        // return to the auth flow
        return done(null, {
          ...myUser,
          isInvite: !!validInvite
        })
      } catch (err) {
        switch (err.constructor) {
          case UserInputError:
            logger.info(err)
            break
          default:
            logger.error(err)
        }
        return done(null, false, { message: err.message })
      }
    }
  )

  passport.use(myStrategy)

  app.get(strategy.url, session, sessionStorage, passportAuthenticate('github'))
  app.get(strategy.callbackUrl, session, passportAuthenticate('github'), finalizeAuth)

  return strategy
}
