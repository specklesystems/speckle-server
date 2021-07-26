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
const { getCommitsByStreamId, getCommitsByBranchName, getCommitById } = require( '../core/services/commits' )
const { getPreviewImage, createObjectPreview, getObjectPreviewInfo } = require( './services/previews' )

const { makeOgImage } = require( './ogImage' )

exports.init = ( app, options ) => {
  if ( process.env.DISABLE_PREVIEWS ) {
    debug( 'speckle:modules' )( '📸 Object preview module is DISABLED' )
  } else {
    debug( 'speckle:modules' )( '📸 Init object preview module' )
  }

  let DEFAULT_ANGLE = '0'

  let getObjectPreviewBufferOrFilepath = async ( { streamId, objectId, angle } ) => {
    if ( process.env.DISABLE_PREVIEWS ) {
      return { type: 'file', file: `${appRoot}/modules/previews/assets/no_preview.png` }
    }

    // Check if objectId is valid
    const dbObj = await getObject( { streamId, objectId } )
    if ( !dbObj ) {
      return { type: 'file', file: `${appRoot}/modules/previews/assets/preview_error.png` }
    }

    // Get existing preview metadata
    let previewInfo = await getObjectPreviewInfo( { streamId, objectId } )
    if ( !previewInfo ) {
      await createObjectPreview( { streamId, objectId, priority: 0 } )
    }

    if ( previewInfo.previewStatus != 2 || !previewInfo.preview ) {
      return { type: 'file', file: `${appRoot}/modules/previews/assets/no_preview.png` }
    }

    let previewImgId = previewInfo.preview[angle]
    if ( !previewImgId ) {
      debug( 'speckle:errors' )( `Error: Preview angle '${angle}' not found for object ${streamId}:${objectId}` )
      return { type: 'file', file: `${appRoot}/modules/previews/assets/preview_error.png` }
    }
    let previewImg = await getPreviewImage( { previewId: previewImgId } )
    if ( !previewImg ) {
      debug( 'speckle:errors' )( `Error: Preview image not found: ${previewImgId}` )
      return { type: 'file', file: `${appRoot}/modules/previews/assets/preview_error.png` }
    }
    return { type: 'buffer', buffer: previewImg }
  }

  let sendObjectPreview = async ( req, res, streamId, objectId, angle ) => {
    let previewBufferOrFile = await getObjectPreviewBufferOrFilepath( { streamId, objectId, angle } )

    if ( req.query.postprocess === 'og' ) {
      const stream = await getStream( { streamId: req.params.streamId } )
      const streamName = stream.name

      if ( previewBufferOrFile.type === 'file' ) {
        previewBufferOrFile = { type: 'buffer', buffer: await makeOgImage( previewBufferOrFile.file, streamName ) }
      } else {
        previewBufferOrFile = { type: 'buffer', buffer: await makeOgImage( previewBufferOrFile.buffer, streamName ) }
      }
    }
    
    if ( previewBufferOrFile.type === 'file' ) {
      res.sendFile( previewBufferOrFile.file )
    } else {
      res.contentType( 'image/png' )
      res.send( previewBufferOrFile.buffer )  
    }
  }

  let checkStreamPermissions = async ( req ) => {
    const stream = await getStream( { streamId: req.params.streamId, userId: req.context.userId } )

    if ( !stream ) {
      return { hasPermissions: false, httpErrorCode: 404 }
    }

    if ( !stream.isPublic && req.context.auth === false ) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    if ( !stream.isPublic ) {
      try {
        await validateScopes( req.context.scopes, 'streams:read' )
      } catch ( err ) {
        return { hasPermissions: false, httpErrorCode: 401 }
      }

      try {
        await authorizeResolver( req.context.userId, req.params.streamId, 'stream:reviewer' )
      } catch ( err ) {
        return { hasPermissions: false, httpErrorCode: 401 }
      }
    }
    return { hasPermissions: true, httpErrorCode: 200 }
  }

  app.get( '/preview/:streamId/objects/:objectId/:angle', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    return sendObjectPreview( req, res, req.params.streamId, req.params.objectId, req.params.angle )
  } )

  app.get( '/preview/:streamId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }
    
    let { commits } = await getCommitsByStreamId( { streamId: req.params.streamId, limit: 1, ignoreGlobalsBranch: true } )
    if ( !commits || commits.length == 0 ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/no_preview.png` )
    }
    let lastCommit = commits[0]

    return sendObjectPreview( req, res, req.params.streamId, lastCommit.referencedObject, DEFAULT_ANGLE )
  } )

  app.get( '/preview/:streamId/branches/:branchName', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    let commitsObj
    try {
      commitsObj = await getCommitsByBranchName( { streamId: req.params.streamId, branchName: req.params.branchName, limit: 1 } )
    } catch {
      commitsObj = {}
    }
    let { commits } = commitsObj
    if ( !commits || commits.length == 0 ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/no_preview.png` )
    }
    let lastCommit = commits[0]

    return sendObjectPreview( req, res, req.params.streamId, lastCommit.referencedObject, DEFAULT_ANGLE )
  } )

  app.get( '/preview/:streamId/commits/:commitId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    let commit = await getCommitById( { id: req.params.commitId } )
    if ( !commit ) {
      return res.sendFile( `${appRoot}/modules/previews/assets/no_preview.png` )
    }

    return sendObjectPreview( req, res, req.params.streamId, commit.referencedObject, DEFAULT_ANGLE )
  } )

  app.get( '/preview/:streamId/objects/:objectId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile( `${appRoot}/modules/previews/assets/preview_error.png` )
    }

    return sendObjectPreview( req, res, req.params.streamId, req.params.objectId, DEFAULT_ANGLE )
  } )

}

exports.finalize = () => {}
