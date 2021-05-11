'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware } = require( `${appRoot}/modules/shared` )
const { validatePermissionsWriteStream } = require( './authUtils' )

const { hasObjects } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/api/diff/:streamId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let hasStreamAccess = await validatePermissionsWriteStream( req.params.streamId, req )
    if ( !hasStreamAccess.result ) {
      return res.status( hasStreamAccess.status ).end()
    }
    
    let objectList = JSON.parse( req.body.objects )

    let response = await hasObjects( { streamId: req.params.streamId, objectIds: objectList } )
    // console.log(response)
    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': 'application/json' } )
    const gzip = zlib.createGzip( )
    gzip.write( JSON.stringify( response ) )
    gzip.flush( )
    gzip.end( )
    gzip.pipe( res )
  } )
}
