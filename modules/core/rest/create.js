'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )

const { createObjects, createObjectsBatched, getObjectChildrenStream } = require( '../services/objects' )

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

  app.get( '/objects/:streamId/object/:objectId', async ( req, res ) => {
    console.log( 'getting objects route' )

    let stream = await getObjectChildrenStream( { objectId: req.params.objectId } )

    let currentChunkSize = 0
    let maxChunkSize = 50000 // 
    let chunk = '['
    let isFirst = true

    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': 'application/json' } )
    // res.setHeader(  )
    const gzip = zlib.createGzip( )

    stream.on( 'data', row => {
      if ( currentChunkSize === 0 ) {
        // chunk = '['
      }

      if(isFirst) {
        isFirst = false
      } else {
        chunk += ','
      }
      // if ( !passedFirstRow ){
      //   chunk += ','
      //   passedFirstRow = false
      // }
     
      let data = JSON.stringify( row.data )
      currentChunkSize += Buffer.byteLength( data, 'utf8' )



      chunk += data

      if ( currentChunkSize >= maxChunkSize ) {
        console.log( 'writing chunk', currentChunkSize )
        // chunk += ']'
        gzip.write( chunk )
        gzip.flush( )
        //res.write( chunk )
        currentChunkSize = 0
        chunk = ''
      }
    } )

    stream.on( 'error', err => {
      // TODO
    } )

    stream.on( 'end', ( ) => {
      if ( currentChunkSize !== 0 ) {
        chunk += ']'
        gzip.write( chunk )
        gzip.flush( )
        currentChunkSize = 0
        chunk = ''
        gzip.end( )
      }
    } )

    gzip.pipe( res )
  } )
}