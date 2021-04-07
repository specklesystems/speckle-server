/* istanbul ignore file */
'use strict'
const passport = require( 'passport' )
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy
const URL = require( 'url' ).URL
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const { findOrCreateUser, getUserByEmail } = require( `${appRoot}/modules/core/services/users` )
const { getServerInfo } = require( `${appRoot}/modules/core/services/generic` )
const { validateInvite } = require( `${appRoot}/modules/serverinvites/services` )

module.exports = async ( app, session, sessionStorage, finalizeAuth ) => {
  const strategy = {
    id: 'google',
    name: 'Google',
    icon: 'mdi-google',
    color: 'red darken-3',
    url: '/auth/goog',
    callbackUrl: '/auth/goog/callback'
  }

  const serverInfo = await getServerInfo()

  let myStrategy = new GoogleStrategy( {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: strategy.callbackUrl,
    scope: [ 'profile', 'email' ],
    passReqToCallback: true
  }, async ( req, accessToken, refreshToken, profile, done ) => {

    try {
      let email = profile.emails[ 0 ].value
      let name = profile.displayName

      let user = { email, name, avatar: profile._json.picture }

      if ( req.session.suuid )
        user.suuid = req.session.suuid

      let existingUser
      existingUser = await getUserByEmail( { email: user.email } )

      if ( !existingUser && serverInfo.inviteOnly )
        throw new Error( 'This server is invite only. Please provide an invite id.' )

      if ( req.session.inviteId ) {
        const valid = await validateInvite( { id:req.session.inviteId, email: user.email } )
        if ( !valid )
          throw new Error( 'Invite email mismatch. Please use the original email the invite was sent to register.' )
      }

      let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
      return done( null, myUser )
    } catch ( err ) {
      debug( 'speckle:errors' )( err )
      return done( null, false, { message: err.message } )
    }
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, sessionStorage, passport.authenticate( 'google' ) )
  app.get( '/auth/goog/callback', session, passport.authenticate( 'google', { failureRedirect: '/error?message=Failed to authenticate.' } ), finalizeAuth )

  return strategy
}
