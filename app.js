'use strict'

let http = require( 'http' )
const express = require( 'express' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )( 'speckle:generic' )
const { ApolloServer } = require( 'apollo-server-express' )

const { contextApiTokenHelper } = require( './modules/shared' )
const knex = require( './db/knex' )

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

  app.get( '/', ( req, res ) => {
    res.send( { fantastic: 'speckle' } )
  } )

  const { init, graph } = require( './modules' )

  // Initialise default modules, including rest api handlers
  await init( app )

  // Initialise graphql server
  const graphqlServer = new ApolloServer( {
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

  let server = http.createServer( app )

  server.on( 'listening', ( ) => {
    debug( `Listening on ${server.address().port}` )
  } )

  server.listen( port )
  
  return { server }
}