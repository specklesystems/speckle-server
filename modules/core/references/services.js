'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
const Refs = ( ) => knex( 'references' )
const BranchCommits = ( ) => knex( 'branch_commits' )

module.exports = {

  /*
    Tags
   */
  createTag: async ( tag, streamId, userId ) => {
    delete tag.commits // let's make sure
    tag.stream_id = streamId
    tag.author = userId
    tag.type = 'tag'
    let [ id ] = await Refs( ).returning( 'id' ).insert( tag )
    return id
  },

  getTagById: async ( tagId ) => {
    let [ ref ] = await Refs( ).where( { id: tagId, type: 'tag' } ).select( '*' )
    return ref
  },

  updateTag: async ( tag ) => {
    delete tag.type
    tag.updatedAt = knex.fn.now( )
    await Refs( ).where( { id: tag.id, type: 'tag' } ).update( tag )
  },

  deleteTagById: async ( tagId ) => {
    return Refs( ).where( { id: tag.id, type: 'tag' } ).del( )
  },

  getTagsByStreamId: async ( streamId ) => {
    return Refs( ).where( { stream_id: streamId, type: 'tag' } ).select( '*' )
  },

  /*
    Branches
   */
  createBranch: async ( branch, streamId, userId ) => {
    let commits = branch.commits || [ ]
    delete branch.commits
    delete branch.commit_id
    branch.stream_id = streamId
    branch.author = userId
    branch.type = 'branch'
    let [ id ] = await Refs( ).returning( 'id' ).insert( branch )

    let branchCommits = commits.map( commitId => { return { branch_id: id, commit_id: commitId } } )
    await BranchCommits( ).insert( branchCommits ) // TODO: on conflict do nothing
    return id
  },

  updateBranch: async ( branch ) => {
    let commits = branch.commits || [ ]
    delete branch.commits
    delete branch.commit_id

    let branchCommits = commits.map( commitId => { return { branch_id: branch.id, commit_id: commitId } } )
    await BranchCommits( ).insert( branchCommits ) // TODO: on conflict do nothing

    await Refs( ).where( { id: branch.id } ).update( branch )
  },

  getBranchCommits: async ( branchId ) => {
    return BranchCommits( ).where( { branch_id: branchId } ).select( 'commit_id' )
  },

  getBranchById: async ( branchId ) => {
    let [ branch ] = await Refs( ).where( { id: branchId, type: 'branch' } ).select( '*' )
    let commits = await BranchCommits( ).where( { branch_id: branchId } )
    branch.commits = commits.map( c => c.commit_id )

    return branch
  },

  getBranchesByStreamId: async ( streamId ) => {
    return Refs( ).where( { stream_id: streamId, type: 'branch' } ).select( '*' )
  },

  /*
    Generic
   */
  getStreamReferences: async ( streamId ) => {
    return Refs( ).where( { stream_id: streamId } ).select( '*' )
  }

}