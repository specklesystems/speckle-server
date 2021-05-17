'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const cors = require( 'cors' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { validatePermissionsReadStream } = require( './authUtils' )

const { getObjectsStream } = require( '../services/objects' )

module.exports = ( app ) => {

  app.options( '/api/getobjects/:streamId', cors() )
  app.post( '/api/getobjects/:streamId', cors(), contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let hasStreamAccess = await validatePermissionsReadStream( req.params.streamId, req )
    if ( !hasStreamAccess.result ) {
      return res.status( hasStreamAccess.status ).end()
    }

    let childrenList = JSON.parse( req.body.objects )

    let simpleText = req.headers.accept === 'text/plain'

    let dbStream = await getObjectsStream( { streamId: req.params.streamId, objectIds: childrenList } )

    let currentChunkSize = 0
    let maxChunkSize = 50000
    let chunk = simpleText ? '' : [ ]
    let isFirstBuffer = true

    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': simpleText ? 'text/plain' : 'application/json' } )

    const gzip = zlib.createGzip( )

    if ( !simpleText ) gzip.write( '[' )

    // helper func to flush the gzip buffer
    const writeBuffer = () => {
      if ( simpleText ) {
        gzip.write( chunk )
      } else {
        if ( !isFirstBuffer ) {
          gzip.write( ',' )
        }
        gzip.write( chunk.join( ',' ) )
      }
      gzip.flush( )
      chunk = simpleText ? '' : [ ]
      isFirstBuffer = false
    }

    let k = 0
    let requestDropped = false
    dbStream.on( 'data', row => {
      try {
        let data = JSON.stringify( row.data )
        currentChunkSize += Buffer.byteLength( data, 'utf8' )
        if ( simpleText ) {
          chunk += `${row.data.id}\t${data}\n`
        } else {
          chunk.push( data )
        }
        if ( currentChunkSize >= maxChunkSize ) {
          currentChunkSize = 0
          writeBuffer()
        }
        k++
      } catch ( e ) {
        requestDropped = true
        debug( 'speckle:error' )( `'Failed to find object, or object is corrupted.' ${req.params.objectId}` )
        return
      }
    } )

    dbStream.on( 'error', err => {
      debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}: ${err}` )
      requestDropped = true
      return
    } )

    dbStream.on( 'end', ( ) => {
      if ( currentChunkSize !== 0 ) {
        writeBuffer()
      }
      if ( !simpleText ) gzip.write( ']' )
      gzip.end( )
    } )

    // 🚬
    gzip.pipe( res )
  } )
}
