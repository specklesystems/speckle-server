'use strict'

const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Streams = ( ) => knex( 'streams' )
// const References = () => knex('references')

module.exports = {
  createStream: ( stream ) => {
    delete stream.id
    delete stream.created_at
    return Streams( ).returning( 'id' ).insert( stream )
  },

  getStream: ( id ) => {
    return Streams( ).where( { id: id } ).first( )
  },

  updateStream: ( id, stream ) => {
    delete stream.id
    delete stream.created_at
    return Streams( ).returning( 'id' ).where( { id: id } ).update( stream )
  },

  deleteStream: ( id ) => {
    throw new Error( 'not implemented' )
  }
}