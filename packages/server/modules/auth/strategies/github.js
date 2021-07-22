/* istanbul ignore file */
'use strict'

const passport = require( 'passport' )
const GithubStrategy = require( 'passport-github2' )
const URL = require( 'url' ).URL
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const { findOrCreateUser, getUserByEmail } = require( `${appRoot}/modules/core/services/users` )
const { getServerInfo } = require( `${appRoot}/modules/core/services/generic` )
const { validateInvite, useInvite } = require( `${appRoot}/modules/serverinvites/services` )

module.exports = async ( app, session, sessionStorage, finalizeAuth ) => {
  const strategy = {
    id: 'github',
    name: 'Github',
    icon: 'mdi-github',
    color: 'grey darken-3',
    url: '/auth/gh',
    callbackUrl: ( new URL( '/auth/gh/callback', process.env.CANONICAL_URL ) ).toString( )
  }

  let myStrategy = new GithubStrategy( {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: strategy.callbackUrl,
    scope: [ 'profile', 'user:email' ],
    passReqToCallback: true
  }, async ( req, accessToken, refreshToken, profile, done ) => {

    const serverInfo = await getServerInfo()

    try {

      let email = profile.emails[ 0 ].value
      let name = profile.displayName || profile.username
      let bio = profile._json.bio

      let user = { email, name, bio }

      if ( req.session.suuid )
        user.suuid = req.session.suuid

      let existingUser
      existingUser = await getUserByEmail( { email: user.email } )

      // if there is an existing user, go ahead and log them in (regardless of
      // whether the server is invite only or not).
      if ( existingUser ) {
        let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
        return done( null, myUser )
      }

      // if the server is not invite only, go ahead and log the user in.
      if ( !serverInfo.inviteOnly ) {
        let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
        return done( null, myUser )
      }

      // if the server is invite only and we have no invite id, throw.
      if ( serverInfo.inviteOnly && !req.session.inviteId ) {
        throw new Error( 'This server is invite only. Please provide an invite id.' )
      }

      // validate the invite
      const validInvite = await validateInvite( { id:req.session.inviteId, email: user.email } )
      if ( !validInvite )
        throw new Error( 'Invalid invite.' )

      // create the user
      let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )

      // use the invite
      await useInvite( { id: req.session.inviteId, email: user.email } )

      // return to the auth flow
      return done( null, myUser )

    } catch ( err ) {

      debug( 'speckle:errors' )( err )
      return done( null, false, { message: err.message } )

    }
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, sessionStorage, passport.authenticate( 'github' ) )
  app.get( '/auth/gh/callback', session, passport.authenticate( 'github', { failureRedirect: '/error?message=Failed to authenticate.' } ), finalizeAuth )

  return strategy
}
