'use strict'


let http = require( 'http' )
const express = require( 'express' )
const root = require( 'app-root-path' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )
const { ApolloServer } = require( 'apollo-server-express' )

require( 'dotenv' ).config( { path: `${root}/.env` } )

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

  app.use( bodyParser.json( ) )
  app.use( bodyParser.urlencoded( { extended: false } ) )

  const { init, graph } = require( './modules' )

  // Initialise default modules, including rest api handlers
  await init( app )

  // Initialise graphql server
  graphqlServer = new ApolloServer( {
    ...graph( ),
    context: contextApiTokenHelper,
    tracing: process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development'
  } )

  graphqlServer.applyMiddleware( { app: app } )

  return { app, graphqlServer }
}

/**
 * Starts a http server, hoisting the express app to it.
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */

const setupCheck = require( `${root}/setupcheck` )
const { createProxyMiddleware } = require( 'http-proxy-middleware' )

exports.startHttp = async ( app ) => {
  let port = process.env.PORT || 3000
  app.set( 'port', port )

  let setupComplete = await setupCheck( )
  
  if ( process.env.NODE_ENV !== 'development' )
    debug( 'speckle:info' )( `Setup is ${setupComplete ? '' : 'not'} complete. Serving ${setupComplete ? 'main app' : 'setup app'}` )

  if ( process.env.NODE_ENV === 'development' ) {
    debug( 'speckle:http-startup' )( 'Proxying frontend (dev mode):' )
    debug( 'speckle:http-startup' )( `👉 setup application: http://localhost:${port}/setup` )
    debug( 'speckle:http-startup' )( `👉 main application: http://localhost:${port}/app` )
    debug( 'speckle:http-startup' )( `👉 auth application: http://localhost:${port}/auth` )
    debug( 'speckle:hint' )( `ℹ️  Don't forget to run "npm run dev:frontend" in a different terminal to start the vue application.` )
    const frontendProxy = createProxyMiddleware( { target: 'http://localhost:8080', changeOrigin: true, ws: false, logLevel: 'silent' } )
    app.use( '/', frontendProxy )
  } else {

    app.use( '/', express.static( `${root}/frontend/dist` ) )

    app.all( '/auth*', async ( req, res ) => {
      try {
        res.sendFile( `${root}/frontend/dist/auth.html` )
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
          res.sendFile( `${root}/frontend/dist/app.html` )
        } else {
          res.sendFile( `${root}/frontend/dist/setup.html` )
        }
      } catch ( error ) {
        res.json( { success: false, message: "Something went wrong" } )
      }
    } );
  }

  let server = http.createServer( app )

  graphqlServer.installSubscriptionHandlers( server )

  server.on( 'listening', ( ) => {
    debug( `  ` )
    debug( `Listening on ${server.address().port}` )
    debug( `  ` )
  } )

  server.listen( port )

  return { server }
}