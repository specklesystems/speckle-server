'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const cors = require( 'cors' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware } = require( `${appRoot}/modules/shared` )
const { validatePermissionsReadStream } = require( './authUtils' )

const { getObject, getObjectChildrenStream } = require( '../services/objects' )
const { SpeckleObjectsStream } = require( './speckleObjectsStream' )
const { pipeline } = require( 'stream' )

module.exports = ( app ) => {

  app.options( '/objects/:streamId/:objectId', cors() )

  app.get( '/objects/:streamId/:objectId', cors(), contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let hasStreamAccess = await validatePermissionsReadStream( req.params.streamId, req )
    if ( !hasStreamAccess.result ) {
      return res.status( hasStreamAccess.status ).end()
    }

    // Populate first object (the "commit")
    let obj = await getObject( { streamId: req.params.streamId, objectId: req.params.objectId } )

    if ( !obj ) {
      return res.status( 404 ).send( `Failed to find object ${req.params.objectId}.` )
    }

    let simpleText = req.headers.accept === 'text/plain'

    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': simpleText ? 'text/plain' : 'application/json' } )

    let dbStream = await getObjectChildrenStream( { streamId: req.params.streamId, objectId: req.params.objectId } )
    let speckleObjStream = new SpeckleObjectsStream( simpleText )
    let gzipStream = zlib.createGzip( )

    speckleObjStream.write( obj )

    pipeline(
      dbStream,
      speckleObjStream,
      gzipStream,
      res,
      ( err ) => {
        if ( err ) {
          debug( 'speckle:error' )( `[User ${req.context.userId || '-'}] Error downloading object ${req.params.objectId} from stream ${req.params.streamId}: ${err}` )
        } else {
          debug( 'speckle:info' )( `[User ${req.context.userId || '-'}] Downloaded object ${req.params.objectId} from stream ${req.params.streamId} (size: ${gzipStream.bytesWritten / 1000000} MB)` )
        }
      }
    )

  } )

  app.options( '/objects/:streamId/:objectId/single', cors() )
  app.get( '/objects/:streamId/:objectId/single', cors(), contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let hasStreamAccess = await validatePermissionsReadStream( req.params.streamId, req )
    if ( !hasStreamAccess.result ) {
      return res.status( hasStreamAccess.status ).end()
    }

    let obj = await getObject( { streamId: req.params.streamId, objectId: req.params.objectId } )

    if ( !obj ) {
      return res.status( 404 ).send( `Failed to find object ${req.params.objectId}.` )
    }

    debug( 'speckle:info' )( `[User ${req.context.userId || '-'}] Downloaded single object ${req.params.objectId} from stream ${req.params.streamId}` )

    res.send( obj.data )
  } )
}
