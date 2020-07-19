'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Branches = ( ) => knex( 'branches' )
const BranchCommits = ( ) => knex( 'branch_commits' )

module.exports = {

  async createBranch( { name, description, streamId, authorId } ) {

    let branch = {}
    branch.id = crs( { length: 10 } )
    branch.streamId = streamId
    branch.authorId = authorId
    branch.name = name
    branch.description = description

    let [ id ] = await Branches( ).returning( 'id' ).insert( branch )

    return branch.id
  },

  async updateBranch( { name, description } ) {
    return await Branches( ).where( { id: branch.id } ).update( { name: name, description: description } )
  },

  async getBranchById( { branchId } ) {
    return await Branches( ).where( { id: branchId } ).first( ).select( '*' )
  },

  async getBranchesByStreamId( { streamId } ) {
    return Branches( ).where( { streamId: streamId } ).select( '*' )
  },

  async deleteBranchById( { branchId } ) {
    return await Branches( ).where( { id: branchId } ).del( )
  },
}