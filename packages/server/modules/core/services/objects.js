'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const { performance } = require( 'perf_hooks' )
const crypto = require( 'crypto' )
const set = require( 'lodash.set' )
const get = require( 'lodash.get' )
const chunk = require( 'lodash.chunk' )

let debug = require( 'debug' )( 'speckle:services' )

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Objects = ( ) => knex( 'objects' )
const Closures = ( ) => knex( 'object_children_closure' )
const StreamCommits = ( ) => knex( 'stream_commits' )

module.exports = {

  async createObject( streamId, object ) {
    let insertionObject = prepInsertionObject( streamId, object )

    let closures = [ ]
    let totalChildrenCountByDepth = {}
    if ( object.__closure !== null ) {
      for ( const prop in object.__closure ) {
        closures.push( { streamId: streamId, parent: insertionObject.id, child: prop, minDepth: object.__closure[ prop ] } )

        if ( totalChildrenCountByDepth[ object.__closure[ prop ].toString( ) ] )
          totalChildrenCountByDepth[ object.__closure[ prop ].toString( ) ]++
        else
          totalChildrenCountByDepth[ object.__closure[ prop ].toString( ) ] = 1
      }
    }

    delete insertionObject.__tree
    delete insertionObject.__closure

    insertionObject.totalChildrenCount = closures.length
    insertionObject.totalChildrenCountByDepth = JSON.stringify( totalChildrenCountByDepth )

    let q1 = Objects( ).insert( insertionObject ).toString( ) + ' on conflict do nothing'
    await knex.raw( q1 )

    if ( closures.length > 0 ) {
      let q2 = `${ Closures().insert( closures ).toString() } on conflict do nothing`
      await knex.raw( q2 )
    }

    return insertionObject.id
  },

  async createObjectsBatched( streamId, objects ) {
    let closures = [ ]
    let objsToInsert = [ ]
    let ids = [ ]

    // Prep objects up
    objects.forEach( obj => {
      let insertionObject = prepInsertionObject( streamId, obj )
      let totalChildrenCountGlobal = 0
      let totalChildrenCountByDepth = {}

      if ( obj.__closure !== null ) {
        for ( const prop in obj.__closure ) {
          closures.push( { streamId: streamId, parent: insertionObject.id, child: prop, minDepth: obj.__closure[ prop ] } )
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

    let closureBatchSize = 1000
    let objectsBatchSize = 500

    // step 1: insert objecs
    if ( objsToInsert.length > 0 ) {
      let batches = chunk( objsToInsert, objectsBatchSize )
      for ( const batch of batches ) {
        prepInsertionObjectBatch( batch )
        await knex.transaction( async trx => {
          let q = Objects( ).insert( batch ).toString( ) + ' on conflict do nothing'
          const inserts = await trx.raw( q )
        } )
        debug( `Inserted ${batch.length} objects` )
      }
    }

    // step 2: insert closures
    if ( closures.length > 0 ) {
      let batches = chunk( closures, closureBatchSize )

      for ( const batch of batches ) {
        prepInsertionClosureBatch( batch )
        await knex.transaction( async trx => {
          let q = Closures( ).insert( batch ).toString( ) + ' on conflict do nothing'
          const inserts = await trx.raw( q )
        } )
        debug( `Inserted ${batch.length} closures` )
      }
    }
    return true
  },

  async createObjects( streamId, objects ) {
    // TODO: Switch to knex batch inserting functionality
    // see http://knexjs.org/#Utility-BatchInsert
    let batches = [ ]
    let maxBatchSize = process.env.MAX_BATCH_SIZE || 250
    objects = [ ...objects ]
    if ( objects.length > maxBatchSize ) {
      while ( objects.length > 0 )
        batches.push( objects.splice( 0, maxBatchSize ) )
    } else {
      batches.push( objects )
    }

    let ids = [ ]

    let promises = batches.map( async ( batch, index ) => new Promise( async ( resolve, reject ) => {
      let closures = [ ]
      let objsToInsert = [ ]

      let t0 = performance.now( )

      batch.forEach( obj => {
        let insertionObject = prepInsertionObject( streamId, obj )
        let totalChildrenCountByDepth = {}
        let totalChildrenCountGlobal = 0
        if ( obj.__closure !== null ) {
          for ( const prop in obj.__closure ) {
            closures.push( { streamId: streamId, parent: insertionObject.id, child: prop, minDepth: obj.__closure[ prop ] } )

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

      if ( objsToInsert.length > 0 ) {
        let queryObjs = Objects( ).insert( objsToInsert ).toString( ) + ' on conflict do nothing'
        await knex.raw( queryObjs )
      }

      if ( closures.length > 0 ) {
        let q2 = `${ Closures().insert( closures ).toString() } on conflict do nothing`
        await knex.raw( q2 )
      }

      let t1 = performance.now( )
      debug( `Batch ${index + 1}/${batches.length}: Stored ${closures.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      // console.log( `Batch ${index + 1}/${batches.length}: Stored ${closures.length + objsToInsert.length} objects in ${t1-t0}ms.` )
      resolve( )
    } ) )

    await Promise.all( promises )

    return ids
  },

  async getObject( { streamId, objectId } ) {
    let res = await Objects( ).where( { streamId: streamId, id: objectId } ).select( '*' ).first( )
    if ( !res ) return null
    res.data.totalChildrenCount = res.totalChildrenCount // move this back
    delete res.streamId // backwards compatibility
    return res
  },

  async getObjectChildrenStream( { streamId, objectId } ) {
    let q = Closures( )
    q.select( 'id' )
    q.select( 'data' )
    q.rightJoin( 'objects', function() {
      this.on( 'objects.streamId', '=', 'object_children_closure.streamId' )
        .andOn( 'objects.id', '=', 'object_children_closure.child' )
    } )
      .where( knex.raw( 'object_children_closure."streamId" = ? AND parent = ?', [ streamId, objectId ] ) )
      .orderBy( 'objects.id' )
    return q.stream( { highWaterMark: 2 } )
  },

  async getObjectChildren( { streamId, objectId, limit, depth, select, cursor } ) {
    limit = parseInt( limit ) || 50
    depth = parseInt( depth ) || 1000

    let fullObjectSelect = false
    let selectStatements = [ ]

    let q = Closures( )
    q.select( 'id' )
    q.select( 'createdAt' )
    q.select( 'speckleType' )
    q.select( 'totalChildrenCount' )

    if ( Array.isArray( select ) ) {
      select.forEach( ( field, index ) => {
        q.select( knex.raw( 'jsonb_path_query(data, :path) as :name:', { path: '$.' + field, name: '' + index } ) )
      } )
    } else {
      fullObjectSelect = true
      q.select( 'data' )
    }

    q.rightJoin( 'objects', function() {
      this.on( 'objects.streamId', '=', 'object_children_closure.streamId' )
        .andOn( 'objects.id', '=', 'object_children_closure.child' )
    } )
      .where( knex.raw( 'object_children_closure."streamId" = ? AND parent = ?', [ streamId, objectId ] ) )
      .andWhere( knex.raw( '"minDepth" < ?', [ depth ] ) )
      .andWhere( knex.raw( 'id > ?', [ cursor ? cursor : '0' ] ) )
      .orderBy( 'objects.id' )
      .limit( limit )

    let rows = await q

    if ( rows.length === 0 ) {
      return { objects: rows, cursor: null }
    }

    if ( !fullObjectSelect )
      rows.forEach( ( o, i, arr ) => {
        let no = { id: o.id, createdAt: o.createdAt, speckleType: o.speckleType, totalChildrenCount: o.totalChildrenCount, data: {} }
        let k = 0
        for ( let field of select ) {
          set( no.data, field, o[ k++ ] )
        }
        arr[ i ] = no
      } )

    let lastId = rows[ rows.length - 1 ].id
    return { objects: rows, cursor: lastId }
  },

  // This query is inefficient on larger sets (n * 10k objects) as we need to return the total count on an arbitrarily (user) defined selection of objects.
  // A possible future optimisation route would be to cache the total count of a query (as objects are immutable, it will not change) on a first run, and, if found on a subsequent round, do a simpler query and merge the total count result.
  async getObjectChildrenQuery( { streamId, objectId, limit, depth, select, cursor, query, orderBy } ) {
    limit = parseInt( limit ) || 50
    depth = parseInt( depth ) || 1000
    orderBy = orderBy || { field: 'id', direction: 'asc' }

    // Cursors received by this service should be base64 encoded. They are generated on first entry query by this service; They should never be client-side generated.
    if ( cursor ) {
      cursor = JSON.parse( Buffer.from( cursor, 'base64' ).toString( 'binary' ) )
    }

    // Flag that keeps track of wether we select the whole "data" part of an object or not
    let fullObjectSelect = false
    if ( Array.isArray( select ) ) {
      // if we order by a field that we do not select, select it!
      if ( orderBy && select.indexOf( orderBy.field ) === -1 ) {
        select.push( orderBy.field )
      }
      // // always add the id!
      // if ( select.indexOf( 'id' ) === -1 ) select.unshift( 'id' )
    } else {
      fullObjectSelect = true
    }

    let additionalIdOrderBy = orderBy.field !== 'id'

    let operatorsWhitelist = [ '=', '>', '>=', '<', '<=', '!=' ]

    let mainQuery = knex.with( 'objs', cteInnerQuery => {
      // always select the id
      cteInnerQuery.select( 'id' ).from( 'object_children_closure' )
      cteInnerQuery.select( 'createdAt' )
      cteInnerQuery.select( 'speckleType' )
      cteInnerQuery.select( 'totalChildrenCount' )

      // if there are any select fields, add them
      if ( Array.isArray( select ) ) {
        select.forEach( ( field, index ) => {
          cteInnerQuery.select( knex.raw( 'jsonb_path_query(data, :path) as :name:', { path: '$.' + field, name: '' + index } ) )
        } )
        // otherwise, get the whole object, as stored in the jsonb column
      } else {
        cteInnerQuery.select( 'data' )
      }

      // join on objects table
      cteInnerQuery.join( 'objects',  function() {
        this.on( 'objects.streamId', '=', 'object_children_closure.streamId' )
          .andOn( 'objects.id', '=', 'object_children_closure.child' )
      } )
        .where( 'object_children_closure.streamId', streamId )
        .andWhere( 'parent', objectId )
        .andWhere( 'minDepth', '<', depth )

      // Add user provided filters/queries.
      if ( Array.isArray( query ) && query.length > 0 ) {
        cteInnerQuery.andWhere( nestedWhereQuery => {
          query.forEach( ( statement, index ) => {
            let castType = 'text'
            if ( typeof statement.value === 'string' ) castType = 'text'
            if ( typeof statement.value === 'boolean' ) castType = 'boolean'
            if ( typeof statement.value === 'number' ) castType = 'numeric'

            if ( operatorsWhitelist.indexOf( statement.operator ) == -1 )
              throw new Error( 'Invalid operator for query' )

            // Determine the correct where clause (where, and where, or where)
            let whereClause
            if ( index === 0 ) whereClause = 'where'
            else if ( statement.verb && statement.verb.toLowerCase( ) === 'or' ) whereClause = 'orWhere'
            else whereClause = 'andWhere'

            // Note: castType is generated from the statement's value and operators are matched against a whitelist.
            // If comparing with strings, the jsonb_path_query(_first) func returns json encoded strings (ie, `bar` is actually `"bar"`), hence we need to add the qoutes manually to the raw provided comparison value.
            nestedWhereQuery[ whereClause ]( knex.raw( `jsonb_path_query_first( data, ? )::${castType} ${statement.operator} ? `, [ '$.' + statement.field, castType === 'text' ? `"${statement.value}"` : statement.value ] ) )
          } )
        } )
      }

      // Order by clause; validate direction!
      let direction = orderBy.direction && orderBy.direction.toLowerCase( ) === 'desc' ? 'desc' : 'asc'
      if ( orderBy.field === 'id' ) {
        cteInnerQuery.orderBy( 'id', direction )
      } else {
        cteInnerQuery.orderByRaw( knex.raw( `jsonb_path_query_first( data, ? ) ${direction}, id asc`, [ '$.' + orderBy.field ] ) )
      }
    } )
      .select( '*' ).from( 'objs' )
      .joinRaw( 'RIGHT JOIN ( SELECT count(*) FROM "objs" ) c(total_count) ON TRUE' )

    // Set cursor clause, if present. If it's not present, it's an entry query; this method will return a cursor based on its given query.
    // We have implemented keyset pagination for more efficient searches on larger sets. This approach depends on an order by value provided by the user and a (hidden) primary key.
    // console.log( cursor )
    if ( cursor ) {
      let castType = 'text'
      if ( typeof cursor.value === 'string' ) castType = 'text'
      if ( typeof cursor.value === 'boolean' ) castType = 'boolean'
      if ( typeof cursor.value === 'number' ) castType = 'numeric'

      // When strings are used inside an order clause, as mentioned above, we need to add qoutes around the comparison value, as the jsonb_path_query funcs return json encoded strings (`{"test":"foo"}` => test is returned as `"foo"`)
      if ( castType === 'text' )
        cursor.value = `"${cursor.value}"`

      if ( operatorsWhitelist.indexOf( cursor.operator ) == -1 )
        throw new Error( 'Invalid operator for cursor' )

      // Unwrapping the tuple comparison of ( userOrderByField, id ) > ( lastValueOfUserOrderBy, lastSeenId )
      if ( fullObjectSelect ) {
        if ( cursor.field === 'id' ) {
          mainQuery.where( knex.raw( `id ${cursor.operator} ? `, [ cursor.value ] ) )
        } else {
          mainQuery.where( knex.raw( `jsonb_path_query_first( data, ? )::${castType} ${cursor.operator}= ? `, [ '$.' + cursor.field, cursor.value ] ) )
        }
      } else {
        mainQuery.where( knex.raw( `??::${castType} ${cursor.operator}= ? `, [ select.indexOf( cursor.field ).toString( ), cursor.value ] ) )
      }

      if ( cursor.lastSeenId ) {
        mainQuery.andWhere( qb => {
          qb.where( 'id', '>', cursor.lastSeenId )
          if ( fullObjectSelect )
            qb.orWhere( knex.raw( `jsonb_path_query_first( data, ? )::${castType} ${cursor.operator} ? `, [ '$.' + cursor.field, cursor.value ] ) )
          else
            qb.orWhere( knex.raw( `??::${castType} ${cursor.operator} ? `, [ select.indexOf( cursor.field ).toString( ), cursor.value ] ) )
        } )
      }
    }

    mainQuery.limit( limit )
    // console.log( mainQuery.toString() )
    // Finally, execute the query
    let rows = await mainQuery
    let totalCount = rows && rows.length > 0 ? parseInt( rows[ 0 ].total_count ) : 0

    // Return early
    if ( totalCount === 0 )
      return { totalCount, objects: [ ], cursor: null }


    // Reconstruct the object based on the provided select paths.
    if ( !fullObjectSelect ) {
      rows.forEach( ( o, i, arr ) => {
        let no = { id: o.id, createdAt: o.createdAt, speckleType: o.speckleType, totalChildrenCount: o.totalChildrenCount, data: {} }
        let k = 0
        for ( let field of select ) {
          set( no.data, field, o[ k++ ] )
        }
        arr[ i ] = no
      } )
    }

    // Assemble the cursor for an eventual next call
    cursor = cursor || {}
    let cursorObj = {
      field: cursor.field || orderBy.field,
      operator: cursor.operator || ( orderBy.direction && orderBy.direction.toLowerCase( ) === 'desc' ? '<' : '>' ),
      value: get( rows[ rows.length - 1 ], `data.${orderBy.field}` )
    }

    // If we're not ordering by id (default case, where no order by argument is provided), we need to add the last seen id of this query in order to enable keyset pagination.
    if ( additionalIdOrderBy ) {
      cursorObj.lastSeenId = rows[ rows.length - 1 ].id
    }

    // Cursor objetcs should be client-side opaque, hence we encode them to base64.
    let cursorEncoded = Buffer.from( JSON.stringify( cursorObj ), 'binary' ).toString( 'base64' )
    return { totalCount, objects: rows, cursor: rows.length === limit ? cursorEncoded : null }
  },

  async getObjects( streamId, objectIds ) {
    let res = await Objects( )
      .whereIn( 'id', objectIds )
      .andWhere( 'streamId', streamId )
      .select( 'id', 'speckleType', 'totalChildrenCount', 'totalChildrenCountByDepth', 'createdAt', 'data' )
    return res
  },

  async getObjectsStream( { streamId, objectIds } ) {
    let res = Objects( )
      .whereIn( 'id', objectIds )
      .andWhere( 'streamId', streamId )
      .orderBy( 'id' )
      .select( 'id', 'speckleType', 'totalChildrenCount', 'totalChildrenCountByDepth', 'createdAt', 'data' )
    return res.stream( { highWaterMark: 2 } )
  },

  async hasObjects( { streamId, objectIds } ) {
    let dbRes = await Objects( )
      .whereIn( 'id', objectIds )
      .andWhere( 'streamId', streamId )
      .select( 'id' )

    let res = {}
    for ( let i in objectIds ) {
      res[ objectIds[ i ] ] = false
    }
    for ( let i in dbRes ) {
      res [ dbRes[ i ].id ] = true
    }
    return res
  },
  
  // NOTE: Derive Object
  async updateObject( ) {
    throw new Error( 'not implemeneted' )
  }
}

// Note: we're generating the hash here, rather than on the db side, as there are
// limitations when doing upserts - ignored fields are not always returned, hence
// we cannot provide a full response back including all object hashes.
function prepInsertionObject( streamId, obj ) {
  let memNow = process.memoryUsage( ).heapUsed / 1024 / 1024
  const MAX_OBJECT_SIZE = 10 * 1024 * 1024

  if ( obj.hash )
    obj.id = obj.hash
  else
    obj.id = obj.id || crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' ) // generate a hash if none is present

  let stringifiedObj = JSON.stringify( obj )
  if ( stringifiedObj.length > MAX_OBJECT_SIZE ) {
    throw new Error( `Object too large (${stringifiedObj.length} > ${MAX_OBJECT_SIZE})` )
  }
  let memAfter = process.memoryUsage( ).heapUsed / 1024 / 1024

  return {
    data: stringifiedObj, // stored in jsonb column
    streamId: streamId,
    id: obj.id,
    speckleType: obj.speckleType
  }
}

// Batches need to be inserted ordered by id to avoid deadlocks
function prepInsertionObjectBatch( batch ) {
  batch.sort( ( a, b ) => ( a.id > b.id ) ? 1 : -1 )
}

function prepInsertionClosureBatch( batch ) {
  batch.sort( ( a, b ) => ( a.parent > b.parent ) ? 1 : ( a.parent === b.parent ) ? ( ( a.child > b.child ) ? 1 : -1 ) : -1 )
}
