'use strict'
const debug = require( 'debug' )
const express = require( 'express' )
const root = require( 'app-root-path' )

exports.init = ( app, options ) => {
  debug( 'speckle:modules' )( '💅 \tInit graphql api explorer module' )

  // app.use( '/explorer', express.static( './'))
  app.get( '/explorer', ( req, res ) => {
    res.sendFile( `${root}/modules/apiexplorer/explorer.html` )
  } )
  // app.get('/explorer', (req, res) => {
  //   res.send('./index.html')
  // }) 
}