'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const cors = require( 'cors' ) 

const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { getObject, getObjectChildrenStream } = require( '../services/objects' )
const { getStream } = require( '../services/streams' )

module.exports = ( app ) => {

  app.options( '/objects/:streamId/:objectId', cors() )

  app.get( '/objects/:streamId/:objectId', cors(), contextMiddleware, async ( req, res ) => {

    const stream = await getStream( { streamId: req.params.streamId, userId: req.context.userId } )

    if ( !stream ) {
      return res.status( 404 ).end()
    }

    if ( !stream.isPublic && req.context.auth === false ) {
      return res.status( 401 ).end( )
    }

    if ( !stream.isPublic ) {
      try {
        await validateScopes( req.context.scopes, 'streams:read' )
      } catch ( err ) {
        return res.status( 401 ).end( )
      }

      try {
        await authorizeResolver( req.context.userId, req.params.streamId, 'stream:reviewer' )
      } catch ( err ) {
        return res.status( 401 ).end( )
      }
    }

    // Populate first object (the "commit")
    let obj = await getObject( { objectId: req.params.objectId } )
    
    if ( !obj ) {
      return res.status( 404 ).send( `Failed to find object ${req.params.objectId}.` )
    }

    obj = obj.data

    let simpleText = req.headers.accept === 'text/plain'

    let dbStream = await getObjectChildrenStream( { objectId: req.params.objectId } )

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
        res.status( 400 ).send( 'Failed to find object, or object is corrupted.' )
      }
    } )

    dbStream.on( 'error', err => {
      debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}` )
      requestDropped = true
      res.status( 400 ).send( 'Failed to find object, or object is corrupted.' )
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

  // TODO: is this needed/used?
  app.get( '/objects/:streamId/:objectId/single', async ( req, res ) => {
    // TODO: authN & authZ checks

    let obj = await getObject( req.params.objectId )

    res.send( obj )
  } )
}
