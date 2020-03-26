'use strict'

const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

// const Streams = ( ) => knex( 'streams' )
// const References = () => knex('references')

module.exports = {
  createActor: ( actor ) => {
    throw new Error( 'not implemented' )
  },

  getActor: ( id ) => {
    throw new Error( 'not implemented' )
  },

  updateActor: ( id, stream ) => {
    throw new Error( 'not implemented' )
  },

  deleteActor: ( id ) => {
    throw new Error( 'not implemented' )
  }
}