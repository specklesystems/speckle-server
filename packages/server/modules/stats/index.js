'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const { registerOrUpdateScope } = require( `${appRoot}/modules/shared` )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '📊 Init stats module' )
  // TODO
}

exports.finalize = async () => {
  // TODO
}
