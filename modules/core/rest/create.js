'use strict'
const { createObjects } = require( '../services/objects' )

module.exports = ( app ) => {
  app.post( '/objects/:streamId', async ( req, res ) => {
    console.log( `Got ${req.body.length} objects for ${req.params.streamId}` )
    if( req.body.length === 0) {
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
}