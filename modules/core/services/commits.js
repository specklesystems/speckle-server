'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Branches = ( ) => knex( 'branches' )
const Commits = ( ) => knex( 'commits' )
const StreamCommits = ( ) => knex( 'stream_commits' )
const BranchCommits = ( ) => knex( 'branch_commits' )
const ParentCommits = ( ) => knex( 'parent_commits' )

const { getBranchesByStreamId } = require( './branches' )

module.exports = {

  async createCommitByBranchId( { streamId, branchId, objectId, authorId, message, previousCommitIds } ) {

    // Create main table entry
    let [ id ] = await Commits( ).returning( 'id' ).insert( {
      id: crs( { length: 10 } ),
      referencedObject: objectId,
      author: authorId,
      message: message
    } )

    // Link it to a branch
    await BranchCommits( ).insert( {
      branchId: branchId,
      commitId: id
    } )

    // Link it to a stream
    await StreamCommits( ).insert( {
      streamId: streamId,
      commitId: commitId
    } )

    // Link it to its children, if any.
    if ( Array.isArray( previousCommitIds ) && previousCommitIds.length !== 0 ) {
      let childrenMap = previousCommitIds.map( childId => { return { parent: id, child: id } } )
      await ParentCommits( ).insert( childrenMap )
    }

    return id
  },

  async createCommitByBranchName( { streamId, branchName, objectId, authorId, message, previousCommitIds } ) {
    let branches = await getBranchesByStreamId( { streamId: streamId } )
    myBranch = bracnhes.find( b => b.name === branchName )

    if ( !myBranch )
      throw new Error( `Failed to find bracnh with name ${branchName}.` )

    return await module.exports.createCommitByBranchId( { streamId, branchId: myBranch.id, objectId, authorId, message, previousCommitIds } )
  },

  async updateCommit( { commitId, message } ) {
    return await Commits( ).where( { id: commitId } ).update( { message: message } )
  },

  async deleteCommit( { commitId } ) {
    return await Commits( ).where( { id: commitId } ).del( )
  },

  async getCommitsByBranchId( { branchId } ) {
    // TODO
    throw new Error( 'Not implemented yet.' )
  },

  async getCommitsByBranchName( { streamId, branchName } ) {
    let branches = await getBranchesByStreamId( { streamId: streamId } )
    myBranch = bracnhes.find( b => b.name === branchName )

    if ( !myBranch )
      throw new Error( `Failed to find bracnh with name ${branchName}.` )

    return module.exports.getCommitsByBranchId( { branchId: myBranch.id } )
  },
}