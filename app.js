/* istanbul ignore file */
'use strict'

const http = require( 'http' )
const url = require( 'url' )
const WebSocket = require( 'ws' )
const express = require( 'express' )
const compression = require( 'compression' )
const appRoot = require( 'app-root-path' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )

const Sentry = require( '@sentry/node' )
const Tracing = require( '@sentry/tracing' )
const SentryInit = require( `${appRoot}/logging` )

const { ApolloServer, ForbiddenError } = require( 'apollo-server-express' )

require( 'dotenv' ).config( { path: `${appRoot}/.env` } )

const { contextApiTokenHelper } = require( './modules/shared' )
const knex = require( './db/knex' )

let graphqlServer

/**
 * Initialises the express application together with the graphql server middleware.
 * @return {[type]} an express applicaiton and the graphql server
 */
exports.init = async ( ) => {
  const app = express( )

  SentryInit( app )

  await knex.migrate.latest( )

  if ( process.env.NODE_ENV !== 'test' ) {
    app.use( logger( 'speckle', 'dev', {} ) )
  }

  if ( process.env.COMPRESSION ) {
    debug( `speckle:startup` )( 'Using app level compression. Consider enabling this at a proxy level.' )
    app.use( compression( ) )
  }

  app.use( bodyParser.json( { limit: '10mb' } ) )
  app.use( bodyParser.urlencoded( { extended: false } ) )
  // app.use( express.json( { limit: '1mb' } ) );

  const { init, graph } = require( './modules' )

  // Initialise default modules, including rest api handlers
  await init( app )

  // Initialise graphql server
  graphqlServer = new ApolloServer( {
    ...graph( ),
    context: contextApiTokenHelper,
    subscriptions: {
      onConnect: ( connectionParams, webSocket, context ) => {
        try {
          if ( connectionParams.Authorization || connectionParams.authorization || connectionParams.headers.Authorization ) {
            let header = connectionParams.Authorization || connectionParams.authorization || connectionParams.headers.Authorization
            let token = header.split( ' ' )[ 1 ]
            return { token: token }
          }
        } catch ( e ) {
          throw new ForbiddenError( 'You need a token to subscribe' )
        }
      },
      onDisconnect: ( webSocket, context ) => {
        // debug( `speckle:debug` )( 'ws on disconnect connect event' )
      },
    },
    plugins: [
      require( `${appRoot}/logging/apolloPlugin` )
    ],
    tracing: process.env.NODE_ENV === 'development'
  } )

  graphqlServer.applyMiddleware( { app: app } )

  return { app, graphqlServer }
}

const { createProxyMiddleware } = require( 'http-proxy-middleware' )

/**
 * Starts a http server, hoisting the express app to it.
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
exports.startHttp = async ( app ) => {
  let port = process.env.PORT || 3000
  app.set( 'port', port )

  let frontendPort = process.env.FRONTEND_PORT || 8080

  // Handles frontend proxying:
  // Dev mode -> proxy form the local webpack server
  if ( process.env.NODE_ENV === 'development' ) {
    const frontendProxy = createProxyMiddleware( { target: `http://localhost:${frontendPort}`, changeOrigin: true, ws: false, logLevel: 'silent' } )
    app.use( '/', frontendProxy )

    debug( 'speckle:http-startup' )( '✨ Proxying frontend (dev mode):' )
    debug( 'speckle:http-startup' )( `👉 main application: http://localhost:${port}/` )
    debug( 'speckle:http-startup' )( `👉 auth application: http://localhost:${port}/auth` )
    debug( 'speckle:hint' )( `        ℹ️  Don't forget to run "npm run dev:frontend" in a different terminal to start the vue application.` )
  }

  // Production mode -> serve things statically.
  else {
    app.use( '/', express.static( `${appRoot}/frontend/dist` ) )

    app.all( '/auth*', async ( req, res ) => {
      try {
        res.sendFile( `${appRoot}/frontend/dist/auth.html` )
      } catch ( err ) {

      }
    } )

    app.all( '*', async ( req, res ) => {
      res.sendFile( `${appRoot}/frontend/dist/app.html` )
    } )
  }

  let server = http.createServer( app )

  // Final apollo server setup
  graphqlServer.installSubscriptionHandlers( server )
  graphqlServer.applyMiddleware( { app: app } )

  app.use( Sentry.Handlers.errorHandler( ) )

  server.on( 'listening', ( ) => {
    debug( `speckle:startup` )( `     🚀 My name is Spockle Server, and I'm running at ${server.address().port}` )
  } )

  server.listen( port )
  return { server }
}
