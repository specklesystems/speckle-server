'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.preflight = ( options ) => {
  debug( 'Preflight core modules' )
}

exports.init = ( app, options ) => {

  debug( 'Init core modules' )

  app.use( '/', require( './streams' ) )
  app.use( '/', require( './references' ) )

}