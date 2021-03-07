'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '♻️  Init pwd reset module' )

  require( './rest' )( app )
}

exports.finalize = async () => {

}
