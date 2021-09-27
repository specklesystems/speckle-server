const crypto = require( 'crypto' )

const knex = require('../knex')
const Streams = ( ) => knex( 'streams' )
const Objects = ( ) => knex( 'objects' )
const Closures = ( ) => knex( 'object_children_closure' )


module.exports = class ObjectSaver {

	constructor( { serverUrl = 'http://localhost:3000', streamId } ) {
		this.serverUrl = serverUrl 
		this.streamId = streamId
		this.isSending = false
		this.buffer = []
	}

	async saveObject( obj ) { 
		if( !obj ) throw new Error( 'Null object' )
		
		if( !obj.id )	{
			obj.id = crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
		}
		
		let res = await createObject( this.streamId, obj )

		return obj.id
	}	

}


async function createObject( streamId, object ) {
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
  }

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