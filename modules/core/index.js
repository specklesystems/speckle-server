'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.preflight = ( options ) => {
  debug( 'Preflight core modules' )

  // TODO: register scopes exposed by this module
  // Base scope schema: 
  // type Scope {
  // name: String! ie streams:read
  // description: String! (human readable explanation)
  // }
  
  // Example scopes: 
  // streams:read, streams:write, users:email, tokens:read, tokens:create
 
  // TODO: register roles exposed by this module.
  // Base role schema:
  // type Role {
  // name: String! (simple name)
  // description: String! (describe its behaviour)
  // resourceTarget: String! (describe which resource it should apply to)
  // aclTableName: String! (where are they stored)
  // }
  
  // Example roles (in use) for streams: 
  // OWNER
  // CONTRIBUTOR
  // REVIEWER
}

exports.init = ( app, options ) => {

  debug( 'Init core modules' )

  app.use( '/', require( './users' ) )
  app.use( '/', require( './streams' ) )
  app.use( '/', require( './references' ) )
  app.use( '/', require( './objects' ) )
}