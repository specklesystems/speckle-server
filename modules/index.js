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

    if ( fs.statSync( fullPath ).isDirectory( ) &&
      file !== 'core' &&
      file !== 'shared'
    ) {
      moduleDirs.push( fullPath )
    }
  } )

  // Core Preflight
  require( './core' ).preflight( app )
  
  // Other modules preflight
  moduleDirs.forEach( dir => {
    require( dir ).preflight( )
  } )

  // Core Init
  require( './core' ).init( app )

  // Other modules init
  moduleDirs.forEach( dir => {
    require( dir ).init( app )
  } )

}