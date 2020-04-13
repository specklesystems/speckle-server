'use strict'
const debug = require( 'debug' )( 'speckle:test' )
const { getUserStreams, getStreamUsers, getStream, createStream, updateStream, deleteStream, grantPermissionsStream, revokePermissionsStream } = require( './services' )

module.exports = {

  async getStreams( req, res, next ) {
    try {
      let streams = await getUserStreams( req.user.id )
      res.status( 200 ).send( streams )
    } catch ( err ) {
      next( err )
    }
  },

  async getStream( req, res, next ) {
    try {
      let stream = await getStream( req.params.resourceId )
      res.status( 200 ).send( stream )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async createStream( req, res, next ) {
    try {
      let id = await createStream( req.body, req.user.id )
      res.status( 201 ).send( { success: true, id: id } )

      req.eventData = { id: id, userId: req.user.userId }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async updateStream( req, res, next ) {
    try {
      req.body.id = req.params.resourceId
      let id = await updateStream( req.body )
      res.status( 200 ).send( { success: true, id: id } )

      req.eventData = { id: id, userId: req.user.userId }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async deleteStream( req, res, next ) {
    try {
      await deleteStream( req.params.resourceId )
      res.status( 200 ).send( { success: true } )
      req.eventData = { id: req.params.resourceId }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async grantPermissions( req, res, next ) {
    try {
      await grantPermissionsStream( req.params.resourceId, req.body.id, req.body.role || 'read' )
      res.status( 201 ).send( { success: true } )

      req.eventData = { id: req.params.resourceId, userId: req.body.id }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async revokePermissions( req, res, next ) {
    try {
      await revokePermissionsStream( req.params.resourceId, req.body.id )
      res.status( 200 ).send( { success: true } )

      req.eventData = { id: req.params.resourceId, userId: req.body.id }
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  async getStreamUsers( req, res, next ) {
    try {
      let users = await getStreamUsers( req.params.resourceId )
      res.status( 200 ).send( users )
    } catch ( err ) {
      next( err )
    }
  }
}