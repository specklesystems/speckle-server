'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
let debug = require( 'debug' )

const { createObjects, createObjectsBatched } = require( '../services/objects' )

module.exports = ( app ) => {

  app.post( '/objects/:streamId', async ( req, res ) => {

    // TODO: authN & authZ checks -> can this user write to this stream? 

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
}