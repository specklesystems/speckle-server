'use strict'

let http = require( 'http' )
const express = require( 'express' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )( 'speckle:errors' )
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

  const { http, graph } = require( './modules' )

  // Initialise default modules, including rest api handlers
  http( app )

  // Initialise graphql server
  const graphqlServer = new ApolloServer( {
    ...graph( ),
    context: contextApiTokenHelper,
    tracing: true
  } )

  graphqlServer.applyMiddleware( { app: app } )

  // Error responses
  app.use( ( err, req, res, next ) => {
    if ( process.env.NODE_ENV === 'test' ) {
      debug( `${err.status}: ${err.message}` )
    }
    res.status( err.status || 500 )
    res.json( {
      message: err.message,
      error: err
    } )
  } )

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

  server.on( 'error', error => {
    let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port

    switch ( error.code ) {
      case 'EACCES':
        console.error( bind + ' whattt requires elevated privileges' )
        process.exit( 1 )
        break
      case 'EADDRINUSE':
        console.error( bind + ' is already in use' )
        process.exit( 1 )
        break
      default:
        throw error
    }
  } )

  server.on( 'listening', ( ) => {
    console.log( `Listening on ${server.address().port}` )
  } )

  server.listen( port )
  
  return { server }
}