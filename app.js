'use strict'

const express = require( 'express' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )
const debug = require( 'debug' )( 'speckle:errors' )
const { ApolloServer } = require( 'apollo-server-express' )

const { contextApiTokenHelper } = require( './modules/shared' )
const knex = require('./db/knex')

exports.init = ( ) => {

  const app = express( )
  
  // Init knex
  knex.migrate.latest()

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

  return app
}