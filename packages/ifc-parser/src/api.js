'use strict'
const crypto = require( 'crypto' )
const crs = require('crypto-random-string')

const knex = require('../knex')
const Streams = ( ) => knex( 'streams' )
const Branches = ( ) => knex( 'branches' )
const Commits = ( ) => knex( 'commits' )
const Objects = ( ) => knex( 'objects' )
const Closures = ( ) => knex( 'object_children_closure' )

const StreamCommits = ( ) => knex( 'stream_commits' )
const BranchCommits = ( ) => knex( 'branch_commits' )
const ParentCommits = ( ) => knex( 'parent_commits' )

module.exports = class ServerAPI {

	constructor( { streamId } ) {
		this.streamId = streamId
		this.isSending = false
		this.buffer = []
	}

	async saveObject( obj ) { 
		if( !obj ) throw new Error( 'Null object' )
		
		if( !obj.id )	{
			obj.id = crypto.createHash( 'md5' ).update( JSON.stringify( obj ) ).digest( 'hex' )
		}
		
		let res = await this.createObject( this.streamId, obj )

		return obj.id
	}	

	async createObject( streamId, object ) {
    let insertionObject = this.prepInsertionObject( streamId, object )

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

prepInsertionObject( streamId, obj ) {
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

async createCommitByBranchName( { streamId, branchName, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } ) {
  branchName = branchName.toLowerCase( )
  let myBranch = await this.getBranchByNameAndStreamId( { streamId: streamId, name: branchName } )

  if ( !myBranch )
    throw new Error( `Failed to find branch with name ${branchName}.` )

  return await this.createCommitByBranchId( { streamId, branchId: myBranch.id, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } )
}

async getBranchByNameAndStreamId( { streamId, name } ) {
  let query = Branches( ).select( '*' ).where( { streamId: streamId } ).andWhere( knex.raw( 'LOWER(name) = ?', [name]) ).first( )
  return await query
}

async createBranch( { name, description, streamId, authorId } ) {
    let branch = {}
    branch.id = crs( { length: 10 } )
    branch.streamId = streamId
    branch.authorId = authorId
    branch.name = name.toLowerCase( )
    branch.description = description

    let [ id ] = await Branches( ).returning( 'id' ).insert( branch )

    // update stream updated at
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )

    return branch.id
  }

async createCommitByBranchId( { streamId, branchId, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } ) {
  // If no total children count is passed in, get it from the original object
  // that this commit references.
  if ( !totalChildrenCount ){
    let { totalChildrenCount: tc } = await getObject( { streamId, objectId } )
    totalChildrenCount = tc || 1
  }

  // Create main table entry
  let [ id ] = await Commits( ).returning( 'id' ).insert( {
    id: crs( { length: 10 } ),
    referencedObject: objectId,
    author: authorId,
    sourceApplication,
    totalChildrenCount,
    parents,
    message
  } )

  // Link it to a branch
  await BranchCommits( ).insert( {branchId: branchId, commitId: id} )
  // Link it to a stream
  await StreamCommits( ).insert( {streamId: streamId,commitId: id} )

  // update stream updated at
  await Streams().where( {id: streamId} ).update( {updatedAt: knex.fn.now()} )
  return id
  }

}