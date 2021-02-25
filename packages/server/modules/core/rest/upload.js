'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { createObjects, createObjectsBatched } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/objects/:streamId', contextMiddleware, matomoMiddleware, async ( req, res ) => {

    debug( 'speckle:upload-endpoint' )( 'booom upload endpoint' )

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

    debug( 'speckle:upload-endpoint' )( 'Upload started' )

    let busboy = new Busboy( { headers: req.headers } )
    let totalProcessed = 0
    let last = {}

    let promises = [ ]
    let requestDropped = false

    busboy.on( 'file', ( fieldname, file, filename, encoding, mimetype ) => {
      if ( requestDropped ) return

      if ( mimetype === 'application/gzip' ) {
        let buffer = [ ]

        file.on( 'data', ( data ) => {
          if ( data ) buffer.push( data )
        } )

        file.on( 'end', async ( ) => {
          if ( requestDropped ) return
          let objs = [ ]
          let gunzipedBuffer = zlib.gunzipSync( Buffer.concat( buffer ) ).toString( )

          try {
            objs = JSON.parse( gunzipedBuffer )
          } catch ( e ) {
            requestDropped = true
            return res.status( 400 ).send( 'Failed to parse data.' )
          }

          last = objs[ objs.length - 1 ]
          totalProcessed += objs.length

          let promise = createObjectsBatched( objs )
          promises.push( promise )

          await promise
        } )
      } else if ( mimetype === 'text/plain' || mimetype === 'application/json' || mimetype === 'application/octet-stream' ) {
        let buffer = ''

        file.on( 'data', ( data ) => {
          if ( data ) buffer += data
        } )

        file.on( 'end', async ( ) => {
          if ( requestDropped ) return
          let objs = [ ]
          try {
            objs = JSON.parse( buffer )
          } catch ( e ) {
            requestDropped = true
            return res.status( 400 ).send( 'Failed to parse data.' )
          }
          last = objs[ objs.length - 1 ]
          totalProcessed += objs.length

          let promise = createObjectsBatched( objs )
          promises.push( promise )

          await promise
        } )
      } else {
        requestDropped = true
        return res.status( 400 ).send( 'Invalid ContentType header. This route only accepts "application/gzip", "text/plain" or "application/json".' )
      }
    } )

    busboy.on( 'finish', async ( ) => {
      if ( requestDropped ) return

      debug( 'speckle:upload-endpoint' )( 'Done parsing ' + totalProcessed + ' objs ' + process.memoryUsage( ).heapUsed / 1024 / 1024 + ' mb mem' )

      await Promise.all( promises )

      debug( 'speckle:upload-endpoint' )( 'Upload ended' )
      res.status( 201 ).end( )
    } )

    req.pipe( busboy )
  } )
}
