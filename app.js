'use strict'


let http = require( 'http' )
const express = require( 'express' )
const root = require( 'app-root-path' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )( 'speckle:generic' )
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
exports.startHttp = async ( app ) => {
  let port = process.env.PORT || 3000
  app.set( 'port', port )

  let setupComplete = await require( `${root}/setupcheck` )( )
  debug( `Setup is ${setupComplete ? '' : 'not'} complete. Serving ${setupComplete ? 'main app' : 'setup app'}` )

  app.use( '/', express.static( `${root}/frontend/dist` ) )
  app.all( '*', ( req, res ) => {
    try {
      if ( setupComplete ) {
        res.sendFile( `${root}/frontend/dist/app.html` )
      } else {
        res.sendFile( `${root}/frontend/dist/setup.html` )
      }
    } catch ( error ) {
      res.json( { success: false, message: "Something went wrong" } )
    }
  } );



  let server = http.createServer( app )
  
  graphqlServer.installSubscriptionHandlers( server )
  
  server.on( 'listening', ( ) => {
    debug( `Listening on ${server.address().port}` )
  } )

  server.listen( port )

  return { server }
}