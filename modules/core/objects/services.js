'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const { performance } = require( 'perf_hooks' )
const crypto = require( 'crypto' )
const set = require( 'lodash.set' )
const get = require( 'lodash.get' )

let debug = require( 'debug' )( 'speckle:services' )

const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Objects = ( ) => knex( 'objects' )
const Refs = ( ) => knex( 'object_tree_refs' )
const Closures = ( ) => knex( 'object_children_closure' )
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

    let insertionObject = prepInsertionObject( object )

    let closures = [ ]
    if ( object.__closure !== null ) {
      for ( const prop in object.__closure ) {
        closures.push( { parent: insertionObject.id, child: prop, minDepth: object.__closure[ prop ] } )
      }
    }

    delete insertionObject.__tree
    delete insertionObject.__closure

    let q1 = Objects( ).insert( insertionObject ).toString( ) + ' on conflict do nothing'
    await knex.raw( q1 )

    if ( closures.length > 0 ) {
      let q2 = `${ Closures().insert( closures ).toString() } on conflict do nothing`
      await knex.raw( q2 )
    }

    return insertionObject.id
  },

  async createObjects( objects ) {
    // TODO: Switch to knex batch inserting functionality
    // see http://knexjs.org/#Utility-BatchInsert
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
      let closures = [ ]
      let objsToInsert = [ ]

      let t0 = performance.now( )

      batch.forEach( obj => {

        let insertionObject = prepInsertionObject( obj )
        let totalChildrenCountByDepth = {}
        let totalChildrenCountGlobal = 0
        if ( obj.__closure !== null ) {
          for ( const prop in obj.__closure ) {
            closures.push( { parent: insertionObject.id, child: prop, minDepth: obj.__closure[ prop ] } )

            totalChildrenCountGlobal++

            if ( totalChildrenCountByDepth[ obj.__closure[ prop ].toString( ) ] )
              totalChildrenCountByDepth[ obj.__closure[ prop ].toString( ) ]++
            else
              totalChildrenCountByDepth[ obj.__closure[ prop ].toString( ) ] = 1
          }
        }

        insertionObject.totalChildrenCount = totalChildrenCountGlobal
        insertionObject.totalChildrenCountByDepth = JSON.stringify( totalChildrenCountByDepth )

        delete insertionObject.__tree
        delete insertionObject.__closure

        objsToInsert.push( insertionObject )
        ids.push( insertionObject.id )
      } )

      let queryObjs = Objects( ).insert( objsToInsert ).toString( ) + ' on conflict do nothing'
      await knex.raw( queryObjs )

      if ( closures.length > 0 ) {
        let q2 = `${ Closures().insert( closures ).toString() } on conflict do nothing`
        await knex.raw( q2 )
      }

      let t1 = performance.now( )
      debug( `Batch ${index + 1}/${batches.length}: Stored ${closures.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      console.log( `Batch ${index + 1}/${batches.length}: Stored ${closures.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      resolve( )
    } ) )

    await Promise.all( promises )

    return ids
  },

  async getObject( objectId ) {
    let res = await Objects( ).where( { id: objectId } ).select( '*' ).first( )
    return res
  },

  async getObjectChildren( { objectId, limit, depth, select, cursor } ) {
    limit = parseInt( limit ) || 50
    depth = parseInt( depth ) || 1000

    let unwrapData = false
    let selectStatements = [ ]

    if ( select && select.length > 0 ) {
      selectStatements.push( `jsonb_path_query(data, '$.id') as id` )
      select.forEach( f => {
        selectStatements += `, jsonb_path_query(data, '$.${ f }') as "${f}"`
      } )
    } else {
      selectStatements.push( '"data"' )
      unwrapData = true
    }

    let q = Closures( )
      .select( knex.raw( selectStatements ) )
      .rightJoin( 'objects', 'objects.id', 'object_children_closure.child' )
      .where( knex.raw( 'parent = ?', [ objectId ] ) )
      .andWhere( knex.raw( '"minDepth" < ?', [ depth ] ) )
      .andWhere( knex.raw( 'id > ?', [ cursor ? cursor : '0' ] ) )
      .orderBy( 'objects.id' )
      .limit( limit )

    let rows = await q

    if ( unwrapData ) rows.forEach( ( o, i, arr ) => arr[ i ] = { ...o.data } )
    else rows.forEach( ( o, i, arr ) => {
      let no = {}
      for ( let key in o ) set( no, key, o[ key ] )
      arr[ i ] = no
    } )

    let lastId = rows[ rows.length - 1 ].id
    return { rows, cursor: lastId }
  },

  async getObjectChildrenQuery( { objectId, limit, depth, select, cursor, query, orderBy } ) {
    limit = parseInt( limit ) || 50
    depth = parseInt( depth ) || 1000
    orderBy = orderBy || { field: 'id', direction: 'asc' }

    if ( cursor ) {
      cursor = JSON.parse( Buffer.from( cursor, 'base64' ).toString( 'binary' ) )
      console.log( '-----' )
      console.log( cursor )
      console.log( '-----' )
    }

    let operatorsWhitelist = [ '=', '>', '>=', '<', '<=', '!=' ]
    let unwrapData = false

    let mainQuery = knex.with( 'objs', cteInnerQuery => {
        cteInnerQuery.select( 'id' ).from( 'object_children_closure' )
        if ( select && select.length > 0 ) {
          // always select the id
          if ( select.indexOf( 'id' ) === -1 )
            select.push( 'id' )

          select.forEach( ( field, index ) => {
            cteInnerQuery.select( knex.raw( 'jsonb_path_query(data, :path) as :name:', { path: "$." + field, name: '' + index } ) )
          } )

          if ( orderBy && select.indexOf( orderBy.field ) === -1 ) {
            cteInnerQuery.select( knex.raw( 'jsonb_path_query(data, :path) as :name:', { path: "$." + orderBy.field, name: select.length } ) )
            select.push( orderBy.field ) // don't order by a field you don't select; it's stupid.
          }
        } else {
          unwrapData = true
          cteInnerQuery.select( 'data' )
        }

        cteInnerQuery.join( 'objects', 'child', '=', 'objects.id' )
          .where( 'parent', objectId )
          .andWhere( 'minDepth', '<', depth )

        // User provided filters/queries. Grouped as to not intefere/override default clauses.
        cteInnerQuery.andWhere( nestedWhereQuery => {
          
          if ( query && query.length > 0 ) {
            query.forEach( ( statement, index ) => {
              let castType = 'string'
              if ( typeof statement.value === 'string' ) castType = 'string'
              if ( typeof statement.value === 'boolean' ) castType = 'boolean'
              if ( typeof statement.value === 'number' ) castType = 'numeric'

              if ( operatorsWhitelist.indexOf( statement.operator ) == -1 )
                throw new Error( 'Invalid operator for query' )

              let whereClause
              if ( index === 0 ) whereClause = 'where'
              else {
                if ( statement.verb && statement.verb.toLowerCase( ) === 'or' ) whereClause = 'orWhere'
                else whereClause = 'andWhere'
              }
              // Note: castType is generated from the statement's value and operators are matched against a whitelist.
              nestedWhereQuery[ whereClause ]( knex.raw( `jsonb_path_query_first( data, ? )::${castType} ${statement.operator} ?? `, [ '$.' + statement.field, statement.value ] ) )
            } )
          }
        } )

        // Order by clause; validate direction!
        let direction = orderBy.direction.toLowerCase( ) === 'desc' ? 'desc' : 'asc'
        cteInnerQuery.orderBy( knex.raw( `jsonb_path_query_first( data, ? )`, [ '$.' + orderBy.field ] ), direction )

      } )
      .select( '*' ).from( 'objs' )
      .joinRaw( 'RIGHT JOIN ( SELECT count(*) FROM "objs" ) c(total_count) ON TRUE' )

    // Set cursor clause, if present.
    if ( cursor ) {
      let castType = 'string'
      if ( typeof cursor.value === 'string' ) castType = 'string'
      if ( typeof cursor.value === 'boolean' ) castType = 'boolean'
      if ( typeof cursor.value === 'number' ) castType = 'numeric'

      if ( operatorsWhitelist.indexOf( cursor.operator ) == -1 )
        throw new Error( 'Invalid operator for cursor' )

      if ( unwrapData ) {// are we selecting the full object? 
        mainQuery.where( knex.raw( `jsonb_path_query_first( data, ? )::${castType} ${cursor.operator} ?? `, [ '$.' + cursor.field, cursor.value ] ) )
      }
      else {
        mainQuery.where( knex.raw( `??::${castType} ${cursor.operator} ?? `, [ select.indexOf( cursor.field ).toString(), cursor.value ] ) )
      }
    }


    mainQuery.limit( limit )

    let rows = await mainQuery
    let totalCount = rows && rows.length > 0 ? parseInt( rows[ 0 ].total_count ) : 0
    console.log( '----' )
    console.log( totalCount )
    console.log( rows[0] )
    console.log( '----' )
    // Return early if there's nothing left...
    if ( totalCount === 0 )
      return { totalCount, objects: [ ], cursor: null }

    if ( unwrapData ) rows.forEach( ( o, i, arr ) => arr[ i ] = { ...o.data } )
    else {
      rows.forEach( ( o, i, arr ) => {
        let no = {}
        let k = 0
        for ( let field of select ) {
          set( no, field, o[ k++ ] )
        }
        arr[ i ] = no
      } )
    }

    cursor = cursor || {}
    let cursorObj = {
      field: cursor.field || orderBy.field,
      operator: cursor.operator || ( orderBy.direction.toLowerCase( ) === 'desc' ? '<' : '>' ),
      value: get( rows[ rows.length - 1 ], orderBy.field )
    }

    let cursorEncoded = Buffer.from( JSON.stringify( cursorObj ), 'binary' ).toString( 'base64' )
    let cursorDecoded = Buffer.from( cursorEncoded, 'base64' ).toString( 'binary' )

    return { totalCount, objects: rows, cursor: cursorEncoded }
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