/* istanbul ignore file */
'use strict'

const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const ObjectPreview = ( ) => knex( 'object_preview' )
const Previews = ( ) => knex( 'previews' )

module.exports = {

  async getObjectPreviewInfo( { streamId, objectId } ) {
    return await ObjectPreview( ).select( '*' ).where( { streamId, objectId } ).first( )
  },

  async createObjectPreview ( { streamId, objectId, priority } ) {
    let insertionObject = {
      streamId,
      objectId,
      priority,
      previewStatus: 0
    }
    let sqlQuery = ObjectPreview( ).insert( insertionObject ).toString( ) + ' on conflict do nothing'
    await knex.raw( sqlQuery )
  },

  async getPreviewImage( { previewId } ) {
    let previewRow = await Previews( ).where( { id: previewId } ).first( ).select( '*' )
    if ( !previewRow ) {
      return null
    }
    return previewRow.data
  }
}
