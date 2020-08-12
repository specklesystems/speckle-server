'use strict'


let http = require( 'http' )
const express = require( 'express' )
const compression = require( 'compression' )
const appRoot = require( 'app-root-path' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )
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
  let obj = graph( )
  console.log( Object.keys( obj.resolvers ) )
  // Initialise graphql server
  graphqlServer = new ApolloServer( {
    ...graph( ),
    context: contextApiTokenHelper,
    subscriptions: {
      onConnect: ( connectionParams, webSocket, context ) => {
        debug( `speckle:debug` )( 'ws on connect event' )
        if ( connectionParams.Authorization ) {
          let token = connectionParams.Authorization.split( ' ' )[ 1 ]
          return { token: token }
        }

        throw new ForbiddenError( 'You need a token to subscribe' )
      },
      onDisconnect: ( webSocket, context ) => {
        debug( `speckle:debug` )( 'ws on disconnect connect event' )
      },
    },
    tracing: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development',
    // debug: true
  } )

  graphqlServer.applyMiddleware( { app: app } )

  return { app, graphqlServer }
}

const setupCheck = require( `${appRoot}/setupcheck` )
const { createProxyMiddleware } = require( 'http-proxy-middleware' )

/**
 * Starts a http server, hoisting the express app to it.
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
exports.startHttp = async ( app ) => {
  let port = process.env.PORT || 3000
  app.set( 'port', port )

  let setupComplete = await setupCheck( )

  if ( process.env.NODE_ENV !== 'development' )
    debug( 'speckle:info' )( `Setup is ${setupComplete ? '' : 'not'} complete. Serving ${setupComplete ? 'main app' : 'setup app'}` )

  if ( process.env.NODE_ENV === 'development' ) {
    const frontendProxy = createProxyMiddleware( { target: 'http://localhost:8080', changeOrigin: true, ws: false, logLevel: 'silent' } )
    app.use( '/', frontendProxy )

    debug( 'speckle:http-startup' )( '✨ Proxying frontend (dev mode):' )
    debug( 'speckle:http-startup' )( `👉 main application: http://localhost:${port}/` )
    debug( 'speckle:http-startup' )( `👉 auth application: http://localhost:${port}/auth` )
    debug( 'speckle:http-startup' )( `👉 setup application: http://localhost:${port}/setup` )
    debug( 'speckle:hint' )( `ℹ️  Don't forget to run "npm run dev:frontend" in a different terminal to start the vue application.` )
  } else {
    app.use( '/', express.static( `${appRoot}/frontend/dist` ) )

    app.all( '/auth*', async ( req, res ) => {
      try {
        res.sendFile( `${appRoot}/frontend/dist/auth.html` )
      } catch ( err ) {

      }
    } )

    app.all( '*', async ( req, res ) => {
      try {
        // refrehsing this variable on every request only if it's false
        if ( !setupComplete ) {
          setupComplete = await setupCheck( )
        }

        if ( setupComplete ) {
          res.sendFile( `${appRoot}/frontend/dist/app.html` )
        } else {
          res.sendFile( `${appRoot}/frontend/dist/setup.html` )
        }
      } catch ( error ) {
        res.json( { success: false, message: "Something went wrong" } )
      }
    } );
  }

  let server = http.createServer( app )
  graphqlServer.installSubscriptionHandlers( server )

  server.on( 'listening', ( ) => {
    debug( `speckle:startup` )( `My name is Spockle Server, and I'm running at ${server.address().port}` )
  } )

  server.listen( port )

  return { server }
}
