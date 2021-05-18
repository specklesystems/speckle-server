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
    const writeBuffer = ( addStartingComma ) => {
      if ( simpleText ) {
        gzip.write( chunk )
      } else {
        if ( addStartingComma ) {
          gzip.write( ',' )
        }
        gzip.write( chunk.join( ',' ) )
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
    writeBuffer( false )

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
      debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}: ${err}` )
      requestDropped = true
      return
    } )

    dbStream.on( 'end', ( ) => {
      if ( currentChunkSize !== 0 ) {
        writeBuffer( true )
      }
      if ( !simpleText ) gzip.write( ']' )
      gzip.end( )
    } )

    // 🚬
    gzip.pipe( res )
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

    res.send( obj.data )
  } )
}
