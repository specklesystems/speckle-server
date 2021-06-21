'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const cors = require( 'cors' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { validatePermissionsReadStream } = require( './authUtils' )
const { SpeckleObjectsStream } = require( './speckleObjectsStream' )
const { getObjectsStream } = require( '../services/objects' )

const { pipeline, PassThrough } = require( 'stream' )

module.exports = ( app ) => {

  app.options( '/api/getobjects/:streamId', cors() )
  app.post( '/api/getobjects/:streamId', cors(), contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let hasStreamAccess = await validatePermissionsReadStream( req.params.streamId, req )
    if ( !hasStreamAccess.result ) {
      return res.status( hasStreamAccess.status ).end()
    }

    let childrenList = JSON.parse( req.body.objects )

    let simpleText = req.headers.accept === 'text/plain'

    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': simpleText ? 'text/plain' : 'application/json' } )

    let dbStream = await getObjectsStream( { streamId: req.params.streamId, objectIds: childrenList } )
    let speckleObjStream = new SpeckleObjectsStream( simpleText )
    let gzipStream = zlib.createGzip( )

    pipeline(
      dbStream,
      speckleObjStream,
      gzipStream,
      new PassThrough( { highWaterMark: 16384 * 31 } ),
      res,
      ( err ) => {
        if ( err ) {
          debug( 'speckle:error' )( `[User ${req.context.userId || '-'}] Error streaming objects from stream ${req.params.streamId}: ${err}` )
        } else {
          debug( 'speckle:info' )( `[User ${req.context.userId || '-'}] Streamed ${childrenList.length} objects from stream ${req.params.streamId} (size: ${gzipStream.bytesWritten / 1000000} MB)` )
        }
      }
    )

  } )
}
