'use strict'

const zlib = require( 'zlib' )
var express = require( 'express' )
var { getObject, getObjectChildrenStream } = require( './services/objects_utils' )

var router = express.Router()


// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.get( '/:streamId/:objectId', async function( req, res, next ) {

  // Populate first object (the "commit")
  let obj = await getObject( { streamId: req.params.streamId, objectId: req.params.objectId } )

  if ( !obj ) {
    return res.status( 404 ).send( `Failed to find object ${req.params.objectId}.` )
  }

  obj = obj.data

  let simpleText = req.headers.accept === 'text/plain'

  let dbStream = await getObjectChildrenStream( { streamId: req.params.streamId, objectId: req.params.objectId } )

  let currentChunkSize = 0
  let maxChunkSize = 50000
  let chunk = simpleText ? '' : [ ]
  let isFirst = true

  res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': simpleText ? 'text/plain' : 'application/json' } )

  const gzip = zlib.createGzip( )

  if ( !simpleText ) gzip.write( '[' )

  // helper func to flush the gzip buffer
  const writeBuffer = ( addTrailingComma ) => {
    // console.log( `writing buff ${currentChunkSize}` )
    if ( simpleText ) {
      gzip.write( chunk )
    } else {
      gzip.write( chunk.join( ',' ) )
      if ( addTrailingComma ) {
        gzip.write( ',' )
      }
    }
    gzip.flush( )
    chunk = simpleText ? '' : [ ]
  }

  var objString = JSON.stringify( obj )
  if ( simpleText ) {
    chunk += `${obj.id}\t${objString}\n`
  } else {
    chunk.push( objString )
  }
  writeBuffer( true )

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
        writeBuffer( true )
      }
      k++
    } catch ( e ) {
      requestDropped = true
      debug( 'speckle:error' )( `'Failed to find object, or object is corrupted.' ${req.params.objectId}` )
      return
    }
  } )

  dbStream.on( 'error', err => {
    console.log("DB ERROR ",err)
    debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}: ${err}` )
    requestDropped = true
    return
  } )

  dbStream.on( 'end', ( ) => {
    if ( currentChunkSize !== 0 ) {
      writeBuffer( false )
      if ( !simpleText ) gzip.write( ']' )
    }
    gzip.end( )
  } )

  // 🚬
  gzip.pipe( res )

} )

module.exports = router
