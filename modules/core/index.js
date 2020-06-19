'use strict'
let debug = require( 'debug' )
const Busboy = require( 'busboy' )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '💥\tInit core module' )

  require( './rest/create' )( app )

  // app.post( '/simplestreaming', ( req, res ) => {

  //   // req.on( 'data', chunk => {
  //   //   console.log( 'Chunk: ' + chunk.toString( ) )
  //   // } )
  //   // req.on( 'end', ( ) => {
  //   //   res.send( 'ok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomer' )
  //   // } )
  //   // 
  //   console.log( `Got ${req.body.length} objects` )
  //   res.send( 'ok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomerok thanks boomer' )
  // } )
}