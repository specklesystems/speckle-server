'use strict'
let debug = require( 'debug' )


exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '💥\tInit core module' )

  // Initialises the two main bulk upload/download endpoints
  require( './rest/upload' )( app )
  require( './rest/download' )( app )

}