'use strict'
let debug = require( 'debug' )( 'speckle:modules' )
const root = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )

const { getApp, createAuthorizationCode, createAppTokenFromAccessCode } = require( './services/apps' )

let authStrategies = [ ]

exports.authStrategies = authStrategies

exports.init = ( app, options ) => {

  debug( '☢️\tInit test module' )

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
    next( )
  }

  let finalizeAuth = async ( req, res, next ) => {
    let app = await getApp( { id: 'spklwebapp' } )
    let ac = await createAuthorizationCode( { appId: app.id, userId: req.user.id, challenge: 'backchannel' } )
    let { token, refreshToken } = await createAppTokenFromAccessCode( { appId: app.id, appSecret: app.secret, accessCode: ac, challenge: 'backchannel' } )

    res.redirect( `/auth/finalize?token=${token}&refreshToken=${refreshToken}&appId=${req.session.appId}` )
  }

  let githubStrategy = require( './strategies/github' )( app, session, sessionAppId, finalizeAuth )

  authStrategies.push( githubStrategy )
  
  let googStrategy = require( './strategies/google' )( app, session, sessionAppId, finalizeAuth )

  authStrategies.push( googStrategy )

  if ( process.env.STRATEGY_LOCAL === 'true' )
    authStrategies.push( { id: 'local', name: 'local', url: '', icon: '', color: '' } )

  // app.get( '/auth', ( req, res ) => {
  //   res.send('test')
  // } )

  // app.get('/auth/register', (req, res) => {
  //   res.send('Register')
  // })

  // app.post('/auth/register', (req, res) => {

  // })

  // app.get('/auth/login', (req, res) => {
  //   res.send('Login')
  // })

  // app.post('/auth/signin', (req, res) => {

  // })

}