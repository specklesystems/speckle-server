'use strict'
let debug = require( 'debug' )( 'speckle:modules' )
const root = require( 'app-root-path' )

const redis = require( 'redis' )
const ExpressSession = require( 'express-session' )
const RedisStore = require( 'connect-redis' )( ExpressSession )
const passport = require( 'passport' )

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

  require( './strategies/github' )( app, session )

  let strategies = [ {
    strategyName: 'Github',
    route: '/auth/github',
    icon: 'github'
  }]

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