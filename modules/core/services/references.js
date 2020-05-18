'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Refs = ( ) => knex( 'references' )
const BranchCommits = ( ) => knex( 'branch_commits' )

module.exports = {

  /*
    Tags
   */
  async createTag( tag, streamId, userId ) {
    delete tag.commits // let's make sure
    tag.id = crs( { length: 10 } )
    tag.streamId = streamId
    tag.author = userId
    tag.type = 'tag'
    let [ id ] = await Refs( ).returning( 'id' ).insert( tag )
    return id
  },

  async getTagById( tagId ) {
    let [ ref ] = await Refs( ).where( { id: tagId, type: 'tag' } ).select( '*' )
    return ref
  },

  async updateTag( tag ) {
    delete tag.type
    tag.updatedAt = knex.fn.now( )
    await Refs( ).where( { id: tag.id, type: 'tag' } ).update( tag )
  },

  async deleteTagById( tagId ) {
    return Refs( ).where( { id: tagId, type: 'tag' } ).del( )
  },

  async getTagsByStreamId( streamId ) {
    return Refs( ).where( { streamId: streamId, type: 'tag' } ).select( '*' )
  },

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