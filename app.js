'use strict'

const express = require( 'express' )
const logger = require( 'morgan-debug' )
const bodyParser = require( 'body-parser' )

exports.init = ( ) => {
  const app = express( )

  if ( process.env.NODE_ENV !== 'test' ) {
    app.use( logger( 'speckle', 'dev', {} ) )
  }

  app.use( bodyParser.json( ) )
  app.use( bodyParser.urlencoded( { extended: false } ) )

  // Error responses
  app.use( ( err, req, res, next ) => {
    res.status( err.status || 500 )
    res.json( {
      message: err.message,
      error: err
    } )
  } )

  app.get( '/', ( req, res ) => {
    res.send( { fantastic: 'speckle' } )
  } )

  require( './modules' )( app )
  // TODO: load modules

  return app
}