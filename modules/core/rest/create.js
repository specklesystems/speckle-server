'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )

const { createObjects, createObjectsBatched } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/objects/:streamId', async ( req, res ) => {
    console.log( `Got ${req.body.length} objects for ${req.params.streamId}` )
    if ( req.body.length === 0 ) {
      console.log( req.body )
      console.log( req.headers )
    }
    // TODO: validate token
    // TODO: validate scopes
    // TODO: validate user role
    // ie: 
    // await validateScopes( context.scopes, 'streams:write' )
    // await authorizeResolver( context.userId, args.id, 'stream:contributor' )

    let ids = await createObjects( req.body )

    res.send( ids )
  } )

  app.post( '/objects/multipart/:streamId', async ( req, res ) => {
    // console.log( req.headers )
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
        // console.log( objs.length )
        totalProcessed += objs.length
        await createObjectsBatched( objs )
      } )
    } )

    busboy.on( 'finish', ( ) => {
      // console.log( '---------' )
      console.log( 'Done parsing ' + totalProcessed + ' objs ' + process.memoryUsage( ).heapUsed / 1024 / 1024 + ' mb mem' )
      // if ( process.memoryUsage( ).heapUsed / 1024 / 1024 > 100 )
      //   console.log( last )
      // console.log( '---------' )
      res.writeHead( 303, { Connection: 'close', Location: '/' } )
      res.end( )
    } )

    // let stream = req.pipe( zlib.createGunzip( ) )
    // stream.pipe( busboy )
    // req.pipe( stream )
    req.pipe( busboy )
  } )
}