'use strict'
let debug = require( 'debug' )( 'speckle:modules' )
const root = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )

const { getApp, createAuthorizationCode, createAppTokenFromAccessCode, refreshAppToken } = require( './services/apps' )

let authStrategies = [ ]

exports.authStrategies = authStrategies

exports.init = ( app, options ) => {

  debug( '🔑 \tInit app, authn and authz module' )

  passport.serializeUser( ( user, done ) => done( null, user ) )
  passport.deserializeUser( ( user, done ) => done( null, user ) )
  app.use( passport.initialize( ) )

  let session = ExpressSession( {
    store: new RedisStore( { client: redis.createClient( process.env.REDIS_URL ) } ),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 60000 * 60 }
  } )

  let sessionAppId = ( req, res, next ) => {
    req.session.appId = req.query.appId
    req.session.challenge = req.query.challenge
    next( )
  }

  let finalizeAuth = async ( req, res, next ) => {
    let app = await getApp( { id: req.session.appId } )
    console.log( req.user )
    let ac = await createAuthorizationCode( { appId: app.id, userId: req.user.id, challenge: req.session.challenge } )
    return res.redirect( `/auth/finalize?appId=${req.session.appId}&access_code=${ac}` )
  }

  app.post( '/auth/token', async ( req, res, next ) => {
    try {
      if ( req.body.refreshToken ) {
        if ( !req.body.appId || !req.body.appSecret )
          throw new Error( 'Invalid request - refresh token' )

        let authResponse = await refreshAppToken( { refreshToken: req.body.refreshToken, appId: req.body.appId, appSecret: req.body.appSecret } )
        return res.send( authResponse )
      }

      if ( !req.body.appId || !req.body.appSecret || !req.body.accessCode || !req.body.challenge )
        throw new Error( 'Invalid request' + JSON.stringify(req.body) )

      let authResponse = await createAppTokenFromAccessCode( { appId: req.body.appId, appSecret: req.body.appSecret, accessCode: req.body.accessCode, challenge: req.body.challenge } )
      return res.send( authResponse )

    } catch ( err ) {
      console.log( err )
      return res.status( 401 ).send( { err: err.message } )
    }
  } )


  // Strategies initialisation & listing

  let githubStrategy = require( './strategies/github' )( app, session, sessionAppId, finalizeAuth )
  authStrategies.push( githubStrategy )

  let googStrategy = require( './strategies/google' )( app, session, sessionAppId, finalizeAuth )
  authStrategies.push( googStrategy )
  
  if ( process.env.STRATEGY_LOCAL ) {
    let localStrategy = require( './strategies/local' )( app, session, sessionAppId, finalizeAuth )
    authStrategies.push( localStrategy )
  }
}