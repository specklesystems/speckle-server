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
      // console.log( `Batch ${index + 1}/${batches.length}: Stored ${objTreeRefs.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      resolve( )
    } ) )

    await Promise.all( promises )

    return ids
  },

  async getObject( objectId ) {
    let res = await Objects( ).where( { id: objectId } ).select( '*' ).first( )
    return res
  },

  async getObjectChildren( objectId, offset, limit, depth, query, fields, orderBy ) {
    offset = Math.abs( offset ) || 0
    limit = Math.abs( limit ) || 100
    depth = Math.abs( depth ) || 2

    fields = [ 'text', 'nest.flag', 'nest.what', 'arr[1]', 'arr[2]', 'nest.orderMe' ]
    let selectFields = `obj_id as id, speckle_type`

    fields.forEach( f => {
      selectFields += `, jsonb_path_query(data, '$.${ f }') as "data.${f}"`
    } )

    orderBy = { property: 'nest.orderMe', direction: 'desc' }

    //  console.log( Refs( ).where( { parent: objectId } ).select( '*' ).toString() )
    //  TODO: Analyse and optimise query. 
    let rawQuery = knex.raw( `
      WITH ids AS (
        SELECT DISTINCT unnest( string_to_array( ltree2text( subltree("path", 1, ${depth}) ), '.') ) as obj_id
        FROM object_tree_refs
        WHERE parent = '${objectId}'
      ),
      objs AS (
        SELECT ${selectFields}
        FROM ids 
        JOIN objects ON ids.obj_id = objects.id
        -- WHERE objects."data" @> '{"text": "This is object 1"}'
        ${ orderBy && orderBy.property && orderBy.direction ? ("ORDER BY jsonb_path_query(data, '$." + orderBy.property + "' ) " + orderBy.direction || "ASC" ) : "ORDER BY obj_id" }
      )
      SELECT * from objs
      RIGHT JOIN (SELECT count(*) FROM objs) d(totalCount) ON TRUE
      OFFSET ${offset}
      LIMIT ${limit}
    ` )

    let betterQuery = `
    WITH ids AS(
      SELECT unnest( string_to_array( ltree2text( subltree("path", 1, 2) ), '.') ) as obj_id
      FROM object_tree_refs
    --   WHERE path ~ '0_hash.*{1}'
      WHERE nlevel(path) = 2
    ),
    objs AS(
      SELECT obj_id, speckle_type, serial_id, 
      jsonb_path_query(data, '$.text') as "data.text", 
      jsonb_path_query(data, '$.nest.flag') as "data.nest.flag", 
      jsonb_path_query(data, '$.nest.what') as "data.nest.what", 
      jsonb_path_query(data, '$.arr[1]') as "data.arr[1]", 
      jsonb_path_query(data, '$.arr[2]') as "data.arr[2]", 
      jsonb_path_query(data, '$.nest.orderMe') as "data.nest.orderMe"
      FROM ids
      JOIN objects ON ids.obj_id = objects.id
    --   WHERE (objects."data" -> 'nest' ->> 'orderMe')::numeric >= 19001
    --   AND (objects."data"->'nest'->>'what') LIKE '%42%'
    )
    SELECT * FROM objs
    RIGHT JOIN (SELECT count(*) FROM objs ) c(total_count) ON TRUE
    ORDER BY serial_id desc
    OFFSET 310
    LIMIT 1000
    `

    console.log( rawQuery.toString( ) )

    let t0 = performance.now( )

    let res = await rawQuery

    let t1 = performance.now( )


    console.log( `Found ${res.rows.length} in ${t1-t0}ms.` )
  },

  async getObjects( objectIds ) {
    let res = await Objects( ).whereIn( 'id', objectIds ).select( '*' )
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