'use strict'
const debug = require( 'debug' )( 'speckle:test' )
const { getStream, createStream, updateStream, grantPermissionsStream, revokePermissionsStream } = require( './services' )

module.exports = {

  getStreams: async ( req, res, next ) => {
    res.status( 418 ).send( { todo: true } )
    next( )
  },

  getStream: async ( req, res, next ) => {
    try {
      let stream = await getStream( req.params.resourceId )
      res.status( 200 ).send( stream )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  createStream: async ( req, res, next ) => {
    try {
      let id = await createStream( req.body, req.user.id )
      res.status( 201 ).send( { success: true, id: id } )

      req.eventData = { id: id, userId: req.user.userId }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  updateStream: async ( req, res, next ) => {
    try {
      let id = await updateStream( req.params.resourceId, req.body )
      res.status( 200 ).send( { success: true, id: id } )

      req.eventData = { id: id, userId: req.user.userId }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  grantPermissions: async ( req, res, next ) => {
    try {
      await grantPermissionsStream( req.params.resourceId, req.body.id, req.body.role )
      
      next( )
    } catch ( err ) {
      next( err )
    }

  },

  revokePermissions: async ( req, res, next ) => {
    try {

    } catch ( err ) {
      next( err )
    }
  },

  getStreamUsers: async ( req, res, next ) => {
    try {

    } catch ( err ) {
      next( err )
    }
  }
}