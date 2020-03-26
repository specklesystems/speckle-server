'use strict'
let debug = require( 'debug' )( 'speckle:modules' )
const root = require( 'app-root-path' )
const mw = require( `${root}/modules/shared` )

exports.preflight = ( options ) => {

  debug( 'Preflight test module' )

  mw.authenticate = ( req, res, next ) => {
    require( 'debug' )( 'speckle:middleware' )( '🔐 Modified authentication middleware called')
    next( )
  }
}

exports.init = ( app, options ) => {
  debug( 'Init test module' )

}