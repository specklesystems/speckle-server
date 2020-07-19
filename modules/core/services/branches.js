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
    branch.name = name.toLowerCase( )
    branch.description = description

    let [ id ] = await Branches( ).returning( 'id' ).insert( branch )

    return branch.id
  },

  async updateBranch( { id, name, description } ) {
    return await Branches( ).where( { id: id } ).update( { name: name, description: description } )
  },

  async getBranchById( { id } ) {
    return await Branches( ).where( { id: id } ).first( ).select( '*' )
  },

  async getBranchesByStreamId( { streamId } ) {
    return Branches( ).where( { streamId: streamId } ).select( '*' )
  },

  async deleteBranchById( { id } ) {
    return await Branches( ).where( { id: id } ).del( )
  },
}