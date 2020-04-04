'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const { performance } = require( 'perf_hooks' )
const crypto = require( 'crypto' )

let debug = require( 'debug' )( 'speckle:services' )

const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Objects = ( ) => knex( 'objects' )
const Refs = ( ) => knex( 'object_tree_refs' )

module.exports = {

  createObject: async ( streamId, userId, object ) => {
    // Prep tree refs
    let objTreeRefs = object.hasOwnProperty( '__tree' ) && object.__tree ? object.__tree.map( entry => {
      return { parent: entry.split( '.' )[ 0 ], path: entry }
    } ) : null

    let insertionObject = prepInsertionObject( object )
    insertionObject.author = userId

    let [ res ] = await Objects( ).returning( 'hash' ).insert( insertionObject )
    await Refs( ).insert( objTreeRefs )

    return res
  },

  createObjects: async ( streamId, userId, objects ) => {
    let objTreeRefs = [ ]
    let objsToInsert = [ ]
    let hashes = [ ]

    let t0 = performance.now( )

    objects.forEach( obj => {

      if ( obj.hasOwnProperty( '__tree' ) && obj.__tree ) {
        objTreeRefs = [ ...objTreeRefs, ...obj.__tree.map( entry => {
          return { parent: entry.split( '.' )[ 0 ], path: entry }
        } ) ]
      }

      let insertionObject = prepInsertionObject( obj )
      insertionObject.author = userId

      objsToInsert.push( insertionObject )
      hashes.push( insertionObject.hash )
    } )

    let queryObjs = Objects( ).insert( objsToInsert ).toString( ) + ' on conflict do nothing'
    let queryRefs = Refs( ).insert( objTreeRefs ).toString( ) + ' on conflict do nothing'
    await knex.raw( queryObjs )
    await knex.raw( queryRefs )

    let t1 = performance.now( )
    // debug( `Stored ${objTreeRefs.length + objsToInsert.length} objects in ${t1-t0}ms.` )

    return hashes
  },

  getObject: async ( objectId ) => {
    let { data } = await Objects( ).where( { hash: objectId } ).select( 'data' ).first( )
    return data
  },

  getObjects: async ( objectIds ) => {
    let res = await Objects( ).whereIn( 'hash', objectIds ).select( 'data' )
    return res.map( r => r.data )
  },

  // NOTE: Derive Object
  updateObject: async ( ) => {
    throw new Error( 'not implemeneted' )
  },

  // NOTE: Dangerous
  deleteObject: async ( ) => {
    // TODO: Cascade through all children?
    throw new Error( 'not implemeneted' )
  },
}

// Note: we're generating the hash here, rather than on the db side, as there are
// limitations when doing upserts - ignored fields are not always returned, hence
// we cannot provide a full response back including all object hashes.
function prepInsertionObject( obj ) {
  obj.hash = obj.hash || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' ) // generate a hash if none is present
  delete obj.__tree
  let stringifiedObj = JSON.stringify( obj )
  return {
    data: stringifiedObj, // stored in jsonb column
    hash: obj.hash,
    applicationId: obj.applicationId,
    speckle_type: obj.speckle_type
  }
}