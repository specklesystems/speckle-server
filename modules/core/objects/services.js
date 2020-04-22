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
const StreamCommits = ( ) => knex( 'stream_commits' )

module.exports = {
  /*
      Commits
      Note: commits are just a special type of objects.
   */

  async createCommit( streamId, userId, object ) {
    object.speckle_type = 'commit'
    object.author = userId

    let id = await module.exports.createObject( object )

    let query = StreamCommits( ).insert( { streamId: streamId, commitId: id } ).toString( ) + ' on conflict do nothing'
    await knex.raw( query )

    return id
  },

  async getCommitsByStreamId( streamId ) {
    let commits = await StreamCommits( ).where( { streamId: streamId } ).rightOuterJoin( 'objects', { 'objects.id': 'stream_commits.commitId' } ).select( '*' )
    return commits
  },

  /*
      Objects Proper
   */
  async createObject( object ) {
    // Prep tree refs
    let objTreeRefs = object.__tree !== null && object.__tree ? object.__tree.map( entry => {
      return { parent: entry.split( '.' )[ 0 ], path: entry }
    } ) : [ ]

    let insertionObject = prepInsertionObject( object )

    let q1 = Objects( ).insert( insertionObject ).toString( ) + ' on conflict do nothing'
    await knex.raw( q1 )

    if ( objTreeRefs.length > 0 ) {
      let q2 = Refs( ).insert( objTreeRefs ).toString( ) + ' on conflict do nothing'
      await knex.raw( q2 )
    }

    return insertionObject.id
  },

  async createObjects( objects ) {
    let batches = [ ]
    let maxBatchSize = process.env.MAX_BATCH_SIZE || 250
    objects = [ ...objects ]
    if ( objects.length > maxBatchSize ) {
      while ( objects.length > 0 )
        batches.push( objects.splice( 0, maxBatchSize ) );
    } else {
      batches.push( objects )
    }

    let ids = [ ]

    let promises = batches.map( async ( batch, index ) => new Promise( async ( resolve, reject ) => {
      let objTreeRefs = [ ]
      let objsToInsert = [ ]

      let t0 = performance.now( )

      batch.forEach( obj => {

        if ( obj.__tree !== null && obj.__tree ) {
          objTreeRefs = [ ...objTreeRefs, ...obj.__tree.map( entry => {
            return { parent: entry.split( '.' )[ 0 ], path: entry }
          } ) ]
        }

        let insertionObject = prepInsertionObject( obj )

        objsToInsert.push( insertionObject )
        ids.push( insertionObject.id )
      } )

      let queryObjs = Objects( ).insert( objsToInsert ).toString( ) + ' on conflict do nothing'
      await knex.raw( queryObjs )

      if ( objTreeRefs.length > 0 ) {
        let queryRefs = Refs( ).insert( objTreeRefs ).toString( ) + ' on conflict do nothing'
        await knex.raw( queryRefs )
      }

      let t1 = performance.now( )
      debug( `Batch ${index + 1}/${batches.length}: Stored ${objTreeRefs.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      resolve( )
    } ) )

    await Promise.all( promises )

    return ids
  },

  async getObject( objectId ) {
    let res = await Objects( ).where( { id: objectId } ).select( '*' ).first( )
    return res
  },

  async getObjects( objectIds ) {
    let res = await Objects( ).whereIn( 'id', objectIds ).select( '*' )
    // return res.map( r => r.data )
    return res
  },

  // NOTE: Derive Object
  async updateObject( ) {
    throw new Error( 'not implemeneted' )
  },

  // NOTE: Dangerous
  async deleteObject( ) {
    // TODO: Cascade through all children?
    throw new Error( 'not implemeneted' )
  },
}

// Note: we're generating the hash here, rather than on the db side, as there are
// limitations when doing upserts - ignored fields are not always returned, hence
// we cannot provide a full response back including all object hashes.
function prepInsertionObject( obj ) {
  obj.id = obj.id || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' ) // generate a hash if none is present
  delete obj.__tree
  let stringifiedObj = JSON.stringify( obj )
  return {
    data: stringifiedObj, // stored in jsonb column
    id: obj.id,
    applicationId: obj.applicationId,
    speckle_type: obj.speckle_type,
    description: obj.description,
    author: obj.author
  }
}