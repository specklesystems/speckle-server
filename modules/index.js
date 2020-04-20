'use strict'
const fs = require( 'fs' )
const path = require( 'path' )
const root = require( 'app-root-path' )
const autoload = require( 'auto-load' )
const values = require( 'lodash.values' )
const merge = require( 'lodash.merge' )
const debug = require( 'debug' )( 'speckle:modules' )
const { scalarResolvers, scalarSchemas } = require( './core/graph/scalars' )

exports.http = ( app ) => {

  let dirs = fs.readdirSync( `${root}/modules` )
  let moduleDirs = [ ]

  dirs.forEach( file => {
    let fullPath = path.join( `${root}/modules`, file )

    if ( fs.statSync( fullPath ).isDirectory( ) && file !== 'core' && file !== 'shared' ) {
      moduleDirs.push( fullPath )
    }
  } )

  /*
      
      Preflight

   */

  // Core Preflight
  require( './core' ).preflight( app )

  // Other modules preflight
  moduleDirs.forEach( dir => {
    require( dir ).preflight( )
  } )

  /*
      
      HTTP Initialisation 
      
   */

  // Core Init
  require( './core' ).init( app )

  // Other modules init
  moduleDirs.forEach( dir => {
    require( dir ).init( app )
  } )

}

exports.graph = ( ) => {
  let dirs = fs.readdirSync( `${root}/modules` )

  // Base query and mutation to allow for type extension by modules.
  let typeDefs = [ `
  ${scalarSchemas}

  type Query { 
  """
  Stare into the void.
  """
    _: Boolean 
  } 
  type Mutation{
  """
  The void stares back.
  """
  _:Boolean
  }` ]

  let resolverObjs = [ ]
  // let directiveDirs = [ ]

  dirs.forEach( file => {
    let fullPath = path.join( `${root}/modules`, file )

    if ( fs.existsSync( path.join( fullPath, 'graph', 'schemas' ) ) ) {
      let moduleSchemas = fs.readdirSync( path.join( fullPath, 'graph', 'schemas' ) )
      moduleSchemas.forEach( schema => {
        typeDefs.push( fs.readFileSync( path.join( fullPath, 'graph', 'schemas', schema ), 'utf8' ) )
      } )
    }

    if ( fs.existsSync( path.join( fullPath, 'graph', 'resolvers' ) ) ) {
      resolverObjs = [ ...resolverObjs, ...values( autoload( path.join( fullPath, 'graph', 'resolvers' ) ) ) ]
    }
  } )

  let resolvers = { ...scalarResolvers }
  resolverObjs.forEach( o => {
    merge( resolvers, o )
  } )

  return { resolvers, typeDefs }

}