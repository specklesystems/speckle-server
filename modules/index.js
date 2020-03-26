'use strict'
const fs = require( 'fs' )
const path = require( 'path' )
const root = require( 'app-root-path' )
let debug = require( 'debug' )( 'speckle:modules' )

module.exports = ( app ) => {

  // Load the other modules
  let dirs = fs.readdirSync( `${root}/modules` )
  let moduleDirs = [ ]
  dirs.forEach( file => {
    let fullPath = path.join( `${root}/modules`, file )

    if ( fs.statSync( fullPath ).isDirectory( ) && file !== 'core' && file !== 'shared' ) {
      moduleDirs.push( fullPath )
    }
  } )

  // Initialize first
  require( './core' ).preflight( app )
  moduleDirs.forEach( dir => {
    require( dir ).preflight( )
  } )

  require( './core' ).init( app )
  moduleDirs.forEach( dir => {
    require( dir ).init( app )
  } )

}