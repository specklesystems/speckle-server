'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'references' )
const Streams = ( ) => knex( 'streams' )

module.exports = {
  createReference: async ( streamId, reference ) => {

  },

  getReference: async ( ) => {

  },

  getStreamReferences: async ( ) => {

  },

  updateReference: async ( ) => {

  },

  deleteReference: async ( ) => {

  },
}