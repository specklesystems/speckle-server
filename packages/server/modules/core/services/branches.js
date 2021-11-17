'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Streams = ( ) => knex( 'streams' )
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

    if ( name ) module.exports.validateBranchName( { name } )

    let [ id ] = await Branches( ).returning( 'id' ).insert( branch )

    // update stream updated at
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )

    return branch.id
  },

  async updateBranch( { id, name, description } ) {
    if ( name ) module.exports.validateBranchName( { name } )
    return await Branches( ).where( { id: id } ).update( { name: name ? name.toLowerCase( ) : name, description: description } )
  },

  validateBranchName( { name } ) {
    if ( name.startsWith( '/' ) || name.startsWith( '#' ) ) throw new Error( 'Branch names cannot start with # or /.' )
  },

  async getBranchById( { id } ) {
    return await Branches( ).where( { id: id } ).first( ).select( '*' )
  },

  async getBranchesByStreamId( { streamId, limit, cursor } ) {
    limit = limit || 25
    let query = Branches( ).select( '*' ).where( { streamId: streamId } )

    if ( cursor ) query.andWhere( 'createdAt', '<', cursor )
    query.orderBy( 'createdAt' ).limit( limit )

    let totalCount = await module.exports.getBranchesByStreamIdTotalCount( { streamId } )
    let rows = await query
    return { items: rows, cursor: rows.length > 0 ? rows[ rows.length - 1 ].updatedAt.toISOString( ) : null, totalCount }
  },

  async getBranchesByStreamIdTotalCount( { streamId } ) {
    let [ res ] = await Branches( ).count( ).where( { streamId: streamId } )
    return parseInt( res.count )
  },

  async getBranchByNameAndStreamId( { streamId, name } ) {
    let query = Branches( ).select( '*' ).where( { streamId: streamId } ).andWhere( knex.raw( 'LOWER(name) = ?', [ name.toLowerCase() ] ) ).first( )
    return await query
  },

  async deleteBranchById( { id, streamId } ) {
    let branch = await module.exports.getBranchById( { id: id } )
    if ( branch.name === 'main' )
      throw new Error( 'Cannot delete the main branch.' )

    await Branches( ).where( { id: id } ).del( )
    await Streams().where( { id: streamId } ).update( { updatedAt: knex.fn.now() } )
    return true
  },
}
