'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { contextMiddleware } = require( `${appRoot}/modules/shared` )
const { getObject, getObjectChildrenStream } = require( '../services/objects' )

module.exports = ( app ) => {

  app.get( '/objects/:streamId/:objectId', contextMiddleware, async ( req, res ) => {

    // TODO: authN & authZ checks

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
    const writeBuffer = ( ) => {
      console.log( `writing buff ${currentChunkSize}` )
      if ( simpleText ) {
        gzip.write( chunk )
      } else {
        gzip.write( `${chunk.join(',')}` )
      }
      gzip.flush( )
      currentChunkSize = 0
      chunk = simpleText ? '' : [ ]
    }

    // Populate first object (the "commit")
    let obj = await getObject( req.params.objectId )
    var objString = JSON.stringify( obj )
    if ( simpleText ) {
      chunk += `${obj.id}\t${objString}\n`
    } else {
      chunk.push( objString + ',' )
    }
    writeBuffer( )

    dbStream.on( 'data', row => {
      let data = JSON.stringify( row.data )
      currentChunkSize += Buffer.byteLength( data, 'utf8' )
      if ( simpleText ) {
        chunk += `${row.data.id}\t${data}\n`
      } else {
        chunk.push( data )
      }
      if ( currentChunkSize >= maxChunkSize ) {
        writeBuffer( )
      }
    } )

    dbStream.on( 'error', err => {
      debug( 'speckle:error' )( `Error in streaming object children for ${req.params.objectId}` )
    } )

    dbStream.on( 'end', ( ) => {
      if ( currentChunkSize !== 0 ) {
        writeBuffer( )
        if ( !simpleText ) gzip.write( ']' )
      }
      gzip.end( )
      console.log( 'written end' )
    } )

    gzip.pipe( res )
  } )

  // TODO: is this needed/used? 
  app.get( '/objects/:streamId/:objectId/single', async ( req, res ) => {

    // TODO: authN & authZ checks

    let obj = await getObject( req.params.objectId )

    res.send( obj )
  } )
}