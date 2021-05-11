'use strict'
const appRoot = require( 'app-root-path' )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { getStream } = require( '../services/streams' )

module.exports = {
  async validatePermissionsReadStream( streamId, req ) {
    const stream = await getStream( { streamId: streamId, userId: req.context.userId } )

    if ( !stream ) {
      return { result: false, status: 404 }
    }

    if ( !stream.isPublic && req.context.auth === false ) {
      return { result: false, status: 401 }
    }

    if ( !stream.isPublic ) {
      try {
        await validateScopes( req.context.scopes, 'streams:read' )
      } catch ( err ) {
        return { result: false, status: 401 }
      }

      try {
        await authorizeResolver( req.context.userId, streamId, 'stream:reviewer' )
      } catch ( err ) {
        return { result: false, status: 401 }
      }
    }

    return { result: true, status: 200 }
  },

  async validatePermissionsWriteStream( streamId, req ) {
    if ( !req.context || !req.context.auth ) {
      return { result: false, status: 401 }
    }

    try {
      await validateScopes( req.context.scopes, 'streams:write' )
    } catch ( err ) {
      return { result: false, status: 401 }
    }

    try {
      await authorizeResolver( req.context.userId, streamId, 'stream:contributor' )
    } catch ( err ) {
      return { result: false, status: 401 }
    }
    
    return { result: true, status: 200 }
  }
}
