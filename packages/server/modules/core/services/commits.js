'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Branches = ( ) => knex( 'branches' )
const Commits = ( ) => knex( 'commits' )
const StreamCommits = ( ) => knex( 'stream_commits' )
const BranchCommits = ( ) => knex( 'branch_commits' )
const ParentCommits = ( ) => knex( 'parent_commits' )

const { getBranchesByStreamId, getBranchByNameAndStreamId } = require( './branches' )
const { getObject } = require( './objects' )

module.exports = {

  async createCommitByBranchId( { streamId, branchId, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } ) {
    // If no total children count is passed in, get it from the original object
    // that this commit references.
    if ( !totalChildrenCount ){
      let { totalChildrenCount: tc } = await getObject( { streamId, objectId } )
      totalChildrenCount = tc || 1
    }

    // Create main table entry
    let [ { id } ] = await Commits( ).returning( 'id' ).insert( {
      id: crs( { length: 10 } ),
      referencedObject: objectId,
      author: authorId,
      sourceApplication,
      totalChildrenCount,
      parents,
      message
    } )

    // Link it to a branch
    await BranchCommits( ).insert( { branchId: branchId, commitId: id } )
    // Link it to a stream
    await StreamCommits( ).insert( { streamId: streamId,commitId: id } )

    // update stream updated at
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )
    return id
  },

  async createCommitByBranchName( { streamId, branchName, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } ) {
    branchName = branchName.toLowerCase( )
    let myBranch = await getBranchByNameAndStreamId( { streamId: streamId, name: branchName } )

    if ( !myBranch )
      throw new Error( `Failed to find branch with name ${branchName}.` )

    return await module.exports.createCommitByBranchId( { streamId, branchId: myBranch.id, objectId, authorId, message, sourceApplication, totalChildrenCount, parents } )
  },

  async updateCommit( { id, message } ) {
    return await Commits( ).where( { id: id } ).update( { message: message } )
  },

  async getCommitById( { streamId, id } ) {
    let query = await Commits( )
      .columns( [ { id: 'commits.id' }, 'message', 'referencedObject', 'sourceApplication', 'totalChildrenCount', 'parents', 'commits.createdAt', { branchName: 'branches.name' }, { authorName: 'users.name' }, { authorId: 'users.id' }, { authorAvatar: 'users.avatar' } ] )
      .select( )
      .join( 'stream_commits', 'commits.id', 'stream_commits.commitId' )
      .join( 'branch_commits', 'commits.id', 'branch_commits.commitId' )
      .join( 'branches', 'branches.id', 'branch_commits.branchId' )
      .leftJoin( 'users', 'commits.author', 'users.id' )
      .where( { 'stream_commits.streamId': streamId, 'commits.id': id } )
      .first( )
    return await query
  },

  async deleteCommit( { id } ) {
    return await Commits( ).where( { id: id } ).del( )
  },

  async getCommitsTotalCountByBranchId( { branchId } ) {
    let [ res ] = await BranchCommits( ).count( ).where( 'branchId', branchId )

    return parseInt( res.count )
  },

  async getCommitsTotalCountByBranchName( { streamId, branchName } ) {
    branchName = branchName.toLowerCase( )
    let myBranch = await getBranchByNameAndStreamId( { streamId: streamId, name: branchName } )

    if ( !myBranch )
      throw new Error( `Failed to find branch with name ${branchName}.` )

    return module.exports.getCommitsTotalCountByBranchId( { branchId: myBranch.id } )
  },

  async getCommitsByBranchId( { branchId, limit, cursor } ) {
    limit = limit || 25
    let query = BranchCommits( )
      .columns( [ { id: 'commitId' }, 'message', 'referencedObject', 'sourceApplication', 'totalChildrenCount', 'parents',  'commits.createdAt', { branchName: 'branches.name' },{ authorName: 'users.name' }, { authorId: 'users.id' }, { authorAvatar: 'users.avatar' } ] )
      .select( )
      .join( 'commits', 'commits.id', 'branch_commits.commitId' )
      .join( 'branches', 'branches.id', 'branch_commits.branchId' )
      .leftJoin( 'users', 'commits.author', 'users.id' )
      .where( 'branchId', branchId )

    if ( cursor )
      query.andWhere( 'commits.createdAt', '<', cursor )

    query.orderBy( 'commits.createdAt', 'desc' ).limit( limit )

    let rows = await query

    return { commits: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].createdAt.toISOString( ) : null }
  },

  async getCommitsByBranchName( { streamId, branchName, limit, cursor } ) {
    branchName = branchName.toLowerCase( )
    let myBranch = await getBranchByNameAndStreamId( { streamId: streamId, name: branchName } )

    if ( !myBranch )
      throw new Error( `Failed to find branch with name ${branchName}.` )

    return module.exports.getCommitsByBranchId( { branchId: myBranch.id, limit, cursor } )
  },

  async getCommitsTotalCountByStreamId( { streamId, ignoreGlobalsBranch } ) {
    let query = StreamCommits( )
      .count( )
      .join( 'branch_commits', 'stream_commits.commitId', 'branch_commits.commitId' )
      .join( 'branches', 'branches.id', 'branch_commits.branchId' )
      .where( 'stream_commits.streamId', streamId )
    
    if ( ignoreGlobalsBranch )
      query.andWhere( 'branches.name', '!=', 'globals' )

    // let [ res ] = await StreamCommits( ).count( ).where( 'streamId', streamId )
    let [ res ] = await query
    return parseInt( res.count )
  },

  async getCommitsByStreamId( { streamId, limit, cursor, ignoreGlobalsBranch } ) {
    limit = limit || 25
    let query = StreamCommits( )
      .columns( [ { id: 'commits.id' }, 'message', 'referencedObject', 'sourceApplication', 'totalChildrenCount', 'parents', 'commits.createdAt', { branchName: 'branches.name' }, { authorName: 'users.name' }, { authorId: 'users.id' }, { authorAvatar: 'users.avatar' } ] )
      .select( )
      .join( 'commits', 'commits.id', 'stream_commits.commitId' )
      .join( 'branch_commits', 'commits.id', 'branch_commits.commitId' )
      .join( 'branches', 'branches.id', 'branch_commits.branchId' )
      .leftJoin( 'users', 'commits.author', 'users.id' )
      .where( 'stream_commits.streamId', streamId )

    if ( ignoreGlobalsBranch )
      query.andWhere( 'branches.name', '!=', 'globals' )

    if ( cursor )
      query.andWhere( 'commits.createdAt', '<', cursor )

    query.orderBy( 'commits.createdAt', 'desc' ).limit( limit )

    let rows = await query
    return { commits: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].createdAt.toISOString( ) : null }
  },

  async getCommitsByUserId( { userId, limit, cursor, publicOnly } ) {
    limit = limit || 25
    publicOnly = publicOnly !== false

    let query =
      Commits( )
        .columns( [ { id: 'commits.id' }, 'message', 'referencedObject', 'sourceApplication', 'totalChildrenCount', 'parents', 'commits.createdAt', { branchName: 'branches.name' }, { streamId: 'stream_commits.streamId' }, { streamName: 'streams.name' } ] )
        .select( )
        .join( 'stream_commits', 'commits.id', 'stream_commits.commitId' )
        .join( 'streams', 'stream_commits.streamId', 'streams.id' )
        .join( 'branch_commits', 'commits.id', 'branch_commits.commitId' )
        .join( 'branches', 'branches.id', 'branch_commits.branchId' )
        .where( 'author', userId )

    if ( publicOnly )
      query.andWhere( 'streams.isPublic', true )

    if ( cursor )
      query.andWhere( 'commits.createdAt', '<', cursor )

    query.orderBy( 'commits.createdAt', 'desc' ).limit( limit )

    let rows = await query
    return { commits: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].createdAt.toISOString( ) : null }
  },

  async getCommitsTotalCountByUserId( { userId } ) {
    let [ res ] = await Commits( ).count( ).where( 'author', userId )
    return parseInt( res.count )
  }
}
