/* istanbul ignore file */
'use strict'

const http = require( 'http' )
const url = require( 'url' )
const express = require( 'express' )
const compression = require( 'compression' )
const appRoot = require( 'app-root-path' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const path = require( 'path' )
const debug = require( 'debug' )

const Sentry = require( '@sentry/node' )
const Tracing = require( '@sentry/tracing' )
const Logging = require( `${appRoot}/logging` )
const { startup: MatStartup } = require( `${appRoot}/logging/matomoHelper` )

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

  Logging( app )
  MatStartup()

  // Moves things along automatically on restart.
  // Should perhaps be done manually?
  await knex.migrate.latest( )

  if ( process.env.NODE_ENV !== 'test' ) {
    app.use( logger( 'speckle', 'dev', {} ) )
  }

  if ( process.env.COMPRESSION ) {
    app.use( compression( ) )
  }

  app.use( bodyParser.json( { limit: '10mb' } ) )
  app.use( bodyParser.urlencoded( { extended: false } ) )

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
    tracing: process.env.NODE_ENV === 'development',
    introspection: true,
    playground: true
  } )

  graphqlServer.applyMiddleware( { app: app } )

  return { app, graphqlServer }
}


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
    const { createProxyMiddleware } = require( 'http-proxy-middleware' )
    const frontendProxy = createProxyMiddleware( { target: `http://localhost:${frontendPort}`, changeOrigin: true, ws: false, logLevel: 'silent' } )
    app.use( '/', frontendProxy )

    debug( 'speckle:startup' )( '✨ Proxying frontend (dev mode):' )
    debug( 'speckle:startup' )( `👉 main application: http://localhost:${port}/` )
    debug( 'speckle:hint' )( 'ℹ️  Don\'t forget to run "npm run dev:frontend" in a different terminal to start the vue application.' )
  }

  // Production mode -> serve things statically.
  else {
    app.use( '/', express.static( path.resolve( `${appRoot}/../frontend/dist` ) ) )

    app.all( '*', async ( req, res ) => {
      res.sendFile( path.resolve( `${appRoot}/../frontend/dist/app.html` ) )
    } )
  }

  let server = http.createServer( app )

  // Final apollo server setup
  graphqlServer.installSubscriptionHandlers( server )
  graphqlServer.applyMiddleware( { app: app } )

  app.use( Sentry.Handlers.errorHandler( ) )

  server.on( 'listening', ( ) => {
    debug( 'speckle:startup' )( `🚀 My name is Speckle Server, and I'm running at ${server.address().port}` )
  } )

  server.listen( port )
  return { server }
}
