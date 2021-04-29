/* istanbul ignore file */
'use strict'

const debug = require( 'debug' )
const express = require( 'express' )
const appRoot = require( 'app-root-path' )

const cors = require( 'cors' )
const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { getStream } = require( '../core/services/streams' )
const { getObject } = require( '../core/services/objects' )
const { getPreviewImage, createObjectPreview, getObjectPreviewInfo } = require( './services/previews' )

exports.init = ( app, options ) => {
  if ( process.env.DISABLE_PREVIEWS ) {
    debug( 'speckle:modules' )( '📸 Object preview module is DISABLED' )
  } else {
    debug( 'speckle:modules' )( '📸 Init object preview module' )
  }

  let sendObjectPreview = async ( req, res, streamId, objectId ) => {
    if ( process.env.DISABLE_PREVIEWS ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/no_preview.png` )
    }

    // Check if objectId is valid
    const dbObj = await getObject( { streamId, objectId } )
    if ( !dbObj ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    // Get existing preview metadata
    let previewInfo = await getObjectPreviewInfo( { streamId, objectId } )
    if ( !previewInfo ) {
      await createObjectPreview( { streamId, objectId, priority: 0 } )
    }

    let timestampStart = Date.now()

    // Try for 10 sec of wall-clock to get the image (wait for preview generation)
    while ( Date.now() < timestampStart + 10*1000 ) {
      previewInfo = await getObjectPreviewInfo( { streamId, objectId } )
      if ( previewInfo.previewStatus == 2 && previewInfo.preview ) {
        break
      }
      await new Promise( ( resolve ) => {
        setTimeout( resolve, 500 )
      } )
    }

    if ( previewInfo.previewStatus != 2 || !previewInfo.preview ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/no_preview.png` )
    }

    let previewImgId = previewInfo.preview[req.params.angle]
    if ( !previewImgId ) {
      debug( 'speckle:errors' )( `Error: Preview angle '${req.params.angle}' not found for object ${streamId}:${objectId}` )
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }
    let previewImg = await getPreviewImage( { previewId: previewImgId } )
    if ( !previewImg ) {
      debug( 'speckle:errors' )( `Error: Preview image not found: ${previewImgId}` )
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    res.contentType( 'image/png' )
    res.send( previewImg )
  }

  app.get( '/preview/:streamId/objects/:objectId/:angle', contextMiddleware, matomoMiddleware, async ( req, res ) => {

    const stream = await getStream( { streamId: req.params.streamId, userId: req.context.userId } )

    if ( !stream ) {
      return res.status( 404 ).end()
    }

    if ( !stream.isPublic && req.context.auth === false ) {
      return res.status( 401 ).end( )
    }

    if ( !stream.isPublic ) {
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
    }

    return sendObjectPreview( req, res, req.params.streamId, req.params.objectId )
  } )
}

exports.finalize = () => {}
