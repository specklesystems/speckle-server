/* istanbul ignore file */
'use strict'
const passport = require( 'passport' )
const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy
const URL = require( 'url' ).URL
const appRoot = require( 'app-root-path' )
const { findOrCreateUser } = require( `${appRoot}/modules/core/services/users` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( '../services/apps' )

module.exports = ( app, session, sessionAppId, finalizeAuth ) => {

  const strategy = {
    id: 'google',
    name: 'Google',
    icon: 'TODO',
    color: 'white red--text',
    url: `/auth/goog`,
    callbackUrl: `/auth/goog/callback`
  }

  let myStrategy = new GoogleStrategy( {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: strategy.callbackUrl,
    scope: [ 'profile', 'email' ],
  }, async ( accessToken, refreshToken, profile, done ) => {

    let email = profile.emails[ 0 ].value
    let name = profile.displayName

    let user = { email, name, username: name.slice( 0, 20 ) }

    let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
    return done( null, myUser )
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, sessionAppId, passport.authenticate( 'google' ) )
  app.get( '/auth/goog/callback', session, passport.authenticate( 'google', { failureRedirect: '/auth/error' } ), finalizeAuth )

  return strategy
}