'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
let debug = require( 'debug' )

const { createObjects, createObjectsBatched, getObject, getObjectChildrenStream } = require( '../services/objects' )

module.exports = ( app ) => {

  app.post( '/objects/:streamId', async ( req, res ) => {

    // TODO: authN & authZ checks

    let busboy = new Busboy( { headers: req.headers } )
    let totalProcessed = 0
    let last = {}

    busboy.on( 'file', ( fieldname, file, filename, encoding, mimetype ) => {
      let buffer = ''

      file.on( 'data', ( data ) => {
        if ( data ) buffer += data
      } )

      file.on( 'end', async ( ) => {
        let objs = JSON.parse( buffer )
        last = objs[ objs.length - 1 ]
        totalProcessed += objs.length
        await createObjectsBatched( objs )
      } )
    } )

    busboy.on( 'finish', ( ) => {
      console.log( 'Done parsing ' + totalProcessed + ' objs ' + process.memoryUsage( ).heapUsed / 1024 / 1024 + ' mb mem' )
      res.writeHead( 303, { Connection: 'close', Location: '/' } )
      res.end( )
    } )

    req.pipe( busboy )
  } )

  app.get( '/objects/:streamId/:objectId', async ( req, res ) => {

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
      chunk += `${obj.id} \t ${objString}\n`
    } else {
      chunk.push( objString + ',' )
    }

    writeBuffer( )

    dbStream.on( 'data', row => {
      let data = JSON.stringify( row.data )
      currentChunkSize += Buffer.byteLength( data, 'utf8' )
      if ( simpleText ) {
        chunk += `${row.data.id} \t ${data}\n`
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
        gzip.end( )
      }
    } )

    gzip.pipe( res )
  } )
}