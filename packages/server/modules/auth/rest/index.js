'use strict'
const appRoot = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )
const debug = require( 'debug' )
const cors = require( 'cors' )

const sentry = require( `${appRoot}/logging/sentryHelper` )
const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { getApp, getAllAppsAuthorizedByUser, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken } = require( '../services/apps' )
const { createPersonalAccessToken, validateToken, revokeTokenById } = require( `${appRoot}/modules/core/services/tokens` )
const { revokeRefreshToken } = require( `${appRoot}/modules/auth/services/apps` )
const { validateScopes, contextMiddleware } = require( `${appRoot}/modules/shared` )

// TODO: Secure these endpoints!
module.exports = ( app ) => {
  /*
  Generates an access code for an app.
  TODO: ensure same origin.
   */
  app.get( '/auth/accesscode', async( req, res, next ) => {
    try {
      let appId = req.query.appId
      let app = await getApp( { id: appId } )
      if ( !app ) throw new Error( 'App does not exist.' )

      let challenge = req.query.challenge
      let userToken = req.query.token

      // 1. Validate token
      let { valid, scopes, userId, role } = await validateToken( userToken )
      if ( !valid ) throw new Error( 'Invalid token' )

      // 2. Validate token scopes
      await validateScopes( scopes, 'tokens:write' )

      let ac = await createAuthorizationCode( { appId, userId, challenge } )
      return res.redirect( `${app.redirectUrl}?access_code=${ac}` )

    } catch ( err ) {
      sentry( { err } )
      debug( 'speckle:errors' )( err )
      return res.status( 400 ).send( err.message )
    }
  } )

  /*
  Generates a new api token: (1) either via a valid refresh token or (2) via a valid access token
   */
  app.options( '/auth/token', cors() )
  app.post( '/auth/token', cors(), matomoMiddleware, async ( req, res, next ) => {
    try {
      // Token refresh
      if ( req.body.refreshToken ) {
        if ( !req.body.appId || !req.body.appSecret )
          throw new Error( 'Invalid request - refresh token' )

        let authResponse = await refreshAppToken( { refreshToken: req.body.refreshToken, appId: req.body.appId, appSecret: req.body.appSecret } )
        return res.send( authResponse )
      }

      // Access-code - token exchange
      if ( !req.body.appId || !req.body.appSecret || !req.body.accessCode || !req.body.challenge )
        throw new Error( 'Invalid request' + JSON.stringify( req.body ) )

      let authResponse = await createAppTokenFromAccessCode( { appId: req.body.appId, appSecret: req.body.appSecret, accessCode: req.body.accessCode, challenge: req.body.challenge } )
      return res.send( authResponse )
    } catch ( err ) {
      sentry( { err } )
      return res.status( 401 ).send( { err: err.message } )
    }
  } )

  /*
  Ensures a user is logged out by invalidating their token and refresh token.
   */
  app.post( '/auth/logout', matomoMiddleware, async ( req, res, next ) => {
    try {
      let token = req.body.token
      let refreshToken = req.body.refreshToken

      if ( !token ) throw new Error( 'Invalid request' )
      await revokeTokenById( token )

      if ( refreshToken )
        revokeRefreshToken( { tokenId:refreshToken } )

      return res.status( 200 ).send( { message: 'You have logged out.' } )

    } catch ( err ){
      sentry( { err } )
      return res.status( 400 ).send( { err: err.message } )
    }
  } )
}
