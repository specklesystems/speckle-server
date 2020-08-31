'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { getObject, getObjectChildrenStream } = require( '../services/objects' )

module.exports = ( app ) => {
  app.get( '/objects/:streamId/:objectId', contextMiddleware, async ( req, res ) => {
    if ( !req.context || !req.context.auth ) {
      return res.status( 401 ).end( )
    }

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
        if ( addTrailingComma ){
          gzip.write( ',' )
        }
      }
      gzip.flush( )
      chunk = simpleText ? '' : [ ]
    }

    // Populate first object (the "commit")
    let obj = await getObject( { objectId: req.params.objectId } )
    var objString = JSON.stringify( obj )
    if ( simpleText ) {
      chunk += `${obj.id}\t${objString}\n`
    } else {
      chunk.push( objString )
    }
    writeBuffer( true )

    let k = 0
    dbStream.on( 'data', row => {
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
    } )

    dbStream.on( 'error', err => {
      debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}` )
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