'use strict'

const passport = require( 'passport' )
const GithubStrategy = require( 'passport-github2' )
const URL = require( 'url' ).URL
const root = require( 'app-root-path' )
const { findOrCreateUser } = require( `${root}/modules/core/services/users` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( '../services/apps' )

module.exports = ( app, session, sessionAppId, finalizeAuth ) => {

  const strategy = {
    id: 'github',
    name: 'Github',
    icon: 'TODO',
    color: 'grey darken-2',
    url: `/auth/gh`,
    callbackUrl: ( new URL( '/auth/gh/callback', process.env.CANONICAL_URL ) ).toString( )
  }

  let myStrategy = new GithubStrategy( {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: strategy.callbackUrl,
    scope: [ 'profile', 'user:email' ],
  }, async ( accessToken, refreshToken, profile, done ) => {
    let email = profile.emails[ 0 ].value
    let name = profile.displayName || profile.username
    let bio = profile._json.bio

    let user = { email, name, bio, username: profile.username }

    let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
    return done( null, myUser )
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, sessionAppId, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ) )
  app.get( '/auth/gh/callback', session, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ), finalizeAuth )

  return strategy
}