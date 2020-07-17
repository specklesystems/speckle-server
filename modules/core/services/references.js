'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Refs = ( ) => knex( 'branches' )
const BranchCommits = ( ) => knex( 'branch_commits' )

module.exports = {

  /*
    Branches
   */
  async createBranch( branch, streamId, userId ) {
    let commits = branch.commits || [ ]
    delete branch.commits
    delete branch.commitId
    branch.id = crs( { length: 10 } )

    branch.streamId = streamId
    branch.author = userId
    branch.type = 'branch'
    let [ id ] = await Refs( ).returning( 'id' ).insert( branch )

    if ( commits.length !== 0 ) {
      let branchCommits = commits.map( commitId => { return { branchId: id, commitId: commitId } } )
      await knex.raw( BranchCommits( ).insert( branchCommits ) + ' on conflict do nothing' )
    }
    return branch.id
  },

  async updateBranch( branch ) {
    let commits = branch.commits || [ ]
    delete branch.commits
    delete branch.commitId

    if ( commits.length !== 0 ) {
      let branchCommits = commits.map( commitId => { return { branchId: branch.id, commitId: commitId } } )
      await knex.raw( BranchCommits( ).insert( branchCommits ) + ' on conflict do nothing' )
    }

    await Refs( ).where( { id: branch.id } ).update( branch )
  },

  async getBranchCommits( branchId ) {
    return BranchCommits( ).where( { branchId: branchId } ).select( 'commitId' )
  },

  async getBranchById( branchId ) {
    let branch = await Refs( ).where( { id: branchId, type: 'branch' } ).first( ).select( '*' )
    let commits = await BranchCommits( ).where( { branchId: branchId } )
    branch.commits = commits.map( c => c.commitId )

    return branch
  },

  async getBranchesByStreamId( streamId ) {
    return Refs( ).where( { streamId: streamId, type: 'branch' } ).select( '*' )
  },

  async deleteBranchById( branchId ) {
    await Refs( ).where( { id: branchId, type: 'branch' } ).del( )
  },
  /*
    Generic
   */
  async getStreamReferences( streamId ) {
    return Refs( ).where( { streamId: streamId } ).select( '*' )
  }

}