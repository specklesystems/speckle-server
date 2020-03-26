'use strict'

const { getStream, createStream, updateStream } = require( '../queries/streams' )

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
      let id = await createStream( req.body )
      res.status( 201 ).send( { todo: true } )
      next( )
    } catch ( err ) {
      next( err )
    }
  },

  updateStream: async ( req, res, next ) => {
    res.send( { todo: true } )
    next( )
  }
}