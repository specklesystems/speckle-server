'use strict'
const zlib = require( 'zlib' )
const Busboy = require( 'busboy' )
const debug = require( 'debug' )
const appRoot = require( 'app-root-path' )

const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { hasObjects } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/api/diff/:streamId', contextMiddleware, matomoMiddleware, async ( req, res ) => {

    if ( !req.context || !req.context.auth ) {
      return res.status( 401 ).end( )
    }

    try {
      await validateScopes( req.context.scopes, 'streams:write' )
    } catch ( err ) {
      return res.status( 401 ).end( )
    }

    try {
      await authorizeResolver( req.context.userId, req.params.streamId, 'stream:contributor' )
    } catch ( err ) {
      return res.status( 401 ).end( )
    }

    let objectList = JSON.parse( req.body.objects )

    let response = await hasObjects( req.params.streamId, objectList )
    // console.log(response)
    res.writeHead( 200, { 'Content-Encoding': 'gzip', 'Content-Type': 'application/json' } )
    const gzip = zlib.createGzip( )
    gzip.write( JSON.stringify( response ) )
    gzip.flush( )
    gzip.end( )
    gzip.pipe( res )
  } )
}
