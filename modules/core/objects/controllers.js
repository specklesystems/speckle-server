'use strict'

const { createCommit, getCommits, createObjects, getObject, getObjects } = require( './services' )

module.exports = {
  async getCommits( req, res, next ) {
    try {
      let commits = await getCommits( req.params.resourceId )
      res.send( commits )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async createCommit( req, res, next ) {
    try {
      let id = await createCommit( req.params.resourceId, req.user.id, req.body )
      res.status( 201 ).send( id )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async getObjects( req, res, next ) {
    try {
      let objIds

      if ( req.params.objectIds ) {
        objIds = req.params.objectIds.split( ',' )
      } else if ( req.body ) {
        objIds = req.body
      }

      if ( !objIds ) throw new Error( 'No objectids specified' )

      let objs = await getObjects( objIds )
      res.send( objs )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async createObjects( req, res, next ) {
    try {
      let hashes = await createObjects( req.body )
      res.status( 201 ).send( hashes )
      next( )
    } catch ( err ) {
      next( err )
    }
  }
}