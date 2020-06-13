'use strict'
const debug = require( 'debug' )
const express = require( 'express' )
const root = require( 'app-root-path' )

exports.init = ( app, options ) => {
  let port = process.env.PORT || 3000
  debug( 'speckle:modules' )( '💅 \tInit graphql api explorer module' )
  if ( process.env.NODE_ENV === 'development' )
    debug( 'speckle:modules' )( `💅 \tGraphQL Explorer: http://localhost:${port}/explorer` )

  // sweet and simple
  app.get( '/explorer', ( req, res ) => {
    res.sendFile( `${root}/modules/apiexplorer/explorer.html` )
  } )
}