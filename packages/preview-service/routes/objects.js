'use strict'

const zlib = require( 'zlib' )
var express = require( 'express' )
var { getObject, getObjectChildrenStream } = require( './services/objects_utils' )
const { SpeckleObjectsStream } = require( './speckleObjectsStream' )
const { pipeline } = require( 'stream' )

var router = express.Router()


// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.get( '/:streamId/:objectId', async function( req, res, next ) {
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
        console.log( `Error downloading object ${req.params.objectId} from stream ${req.params.streamId}: ${err}` )
      } else {
        console.log( `Downloaded object ${req.params.objectId} from stream ${req.params.streamId} (size: ${gzipStream.bytesWritten / 1000000} MB)` )
      }
    }
  )

} )

module.exports = router
