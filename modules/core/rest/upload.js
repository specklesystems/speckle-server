'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { createObjects, createObjectsBatched } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/objects/:streamId', contextMiddleware, async ( req, res ) => {
    if ( !req.context || !req.context.auth ) {
      return res.status( 401 ).end( )
    }

    try {
      await validateScopes( req.context.scopes, 'streams:write' )
    } catch ( err ) {
      return res.status( 401 ).end( )
    }

    try {
      await authorizeResolver( req.context.userId, req.params.streamId, 'stream:contributor' )
    } catch ( err ) {
      return res.status( 401 ).end( )
    }

    let busboy = new Busboy( { headers: req.headers } )
    let totalProcessed = 0
    let last = {}

    busboy.on( 'file', ( fieldname, file, filename, encoding, mimetype ) => {
      let buffer = ''

      file.on( 'data', ( data ) => {
        if ( data ) buffer += data
      } )

      file.on( 'end', async ( ) => {
        let objs = JSON.parse( buffer )
        last = objs[ objs.length - 1 ]
        totalProcessed += objs.length
        await createObjectsBatched( objs )
      } )
    } )

    busboy.on( 'finish', ( ) => {
      debug( 'speckle:upload-endpoint' )( 'Done parsing ' + totalProcessed + ' objs ' + process.memoryUsage( ).heapUsed / 1024 / 1024 + ' mb mem' )

      res.status( 201 ).end( )
    } )

    req.pipe( busboy )
  } )
}
