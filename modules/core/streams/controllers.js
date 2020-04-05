'use strict'

const { getStream, createStream, updateStream } = require( './services' )

module.exports = {

  getStreams: async ( req, res, next ) => {
    res.status( 418 ).send( { todo: true } )
    next( )
  },

  getStream: async ( req, res, next ) => {
    res.status( 418 ).send( "meeps" )
    next( )
  },

  createStream: async ( req, res, next ) => {
    try {
      let id = await createStream( req.body, req.user.userId )
      res.status( 201 ).send( { success: true, id: id } )
      req.eventData = { id: id, userId: req.user.userId }
      next( )
    } catch ( err ) {
      console.log( err )
      next( err )
    }
  },

  updateStream: async ( req, res, next ) => {
    res.send( { todo: true } )
    next( )
  }
}