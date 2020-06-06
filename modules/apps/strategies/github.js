'use strict'

const passport = require( 'passport' )
const GithubStrategy = require( 'passport-github2' )
const URL = require( 'url' ).URL
const root = require( 'app-root-path' )
const { findOrCreateUser } = require( `${root}/modules/core/services/users` )
const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( '../services/apps' )

module.exports = ( app, session ) => {

  const strategy = {
    id: 'github',
    strategyName: 'Github',
    strategyIcon: 'TODO',
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
    let name = profile.displayName || profie.username
    let bio = profile._json.bio

    let user = { email, name, bio, username: profile.username }

    try {
      let myUser = await findOrCreateUser( { user: user, rawProfile: profile._raw } )
      return done( null, myUser )
    } catch ( err ) {
      console.log( err )
    }
  } )

  passport.use( myStrategy )

  app.get( strategy.url, session, ( req, res, next ) => {
    req.session.appId = req.query.appId
    next( )
  }, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ) )

  app.get( '/auth/gh/callback', session, passport.authenticate( 'github', { failureRedirect: '/auth/error' } ), async ( req, res, next ) => {

    let app = await getApp( { id: 'spklwebapp' } )
    let ac = await createAuthorizationCode( { appId: app.id, userId: req.user.id, challenge: 'backchannel' } )
    let { token, refreshToken } = await createAppTokenFromAccessCode( { appId: app.id, appSecret: app.secret, accessCode: ac, challenge: 'backchannel' } )

    res.redirect( `/auth/finalize?token=${token}&refreshToken=${refreshToken}&appId=${req.session.appId}&strategy=${strategy.id}` )
  } )

  return strategy
}