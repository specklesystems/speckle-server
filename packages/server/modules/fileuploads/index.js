/* istanbul ignore file */
'use strict'

const debug = require( 'debug' )
const express = require( 'express' )
const appRoot = require( 'app-root-path' )
const Busboy = require( 'busboy' )

const cors = require( 'cors' )
const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { checkBucket, uploadFile, getFileInfo, getFileStream } = require( './services/fileuploads' )
const { getStream } = require ( '../core/services/streams' )

exports.init = async ( app, options ) => {
  if ( process.env.DISABLE_FILE_UPLOADS ) {
    debug( 'speckle:modules' )( '📄 FileUploads module is DISABLED' )
    return
  } else {
    debug( 'speckle:modules' )( '📄 Init FileUploads module' )
  }

  if ( !process.env.S3_BUCKET ) {
    debug( 'speckle:modules' )( 'ERROR: S3_BUCKET env variable was not specified. File uploads will be DISABLED.' )
    return
  }

  await checkBucket()


  let checkStreamPermissions = async ( req ) => {
    if ( !req.context || !req.context.auth ) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    try {
      await validateScopes( req.context.scopes, 'streams:write' )
    } catch ( err ) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    try {
      await authorizeResolver( req.context.userId, req.params.streamId, 'stream:contributor' )
    } catch ( err ) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    return { hasPermissions: true, httpErrorCode: 200 }
  }

  app.get( '/api/file/:fileId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    if ( process.env.DISABLE_FILE_UPLOADS ) {
      return res.status( 503 ).send( 'File uploads are disabled on this server' )
    }

    let fileInfo = await getFileInfo( { fileId: req.params.fileId } )

    if ( !fileInfo )
      return res.status( 404 ).send( 'File not found' )

    // Check stream read access
    let streamId = fileInfo.streamId
    const stream = await getStream( { streamId: streamId, userId: req.context.userId } )
    
    if ( !stream ) {
      return res.status( 404 ).send( 'File stream not found' )
    }

    if ( !stream.isPublic && req.context.auth === false ) {
      return res.status( 401 ).send( 'You must be logged in to access private streams' )
    }

    if ( !stream.isPublic ) {
      try {
        await validateScopes( req.context.scopes, 'streams:read' )
      } catch ( err ) {
        return res.status( 401 ).send( 'The provided auth token can\'t read streams' )
      }

      try {
        await authorizeResolver( req.context.userId, streamId, 'stream:reviewer' )
      } catch ( err ) {
        return res.status( 401 ).send( 'You don\'t have access to this private stream' )
      }
    }

    let fileStream = await getFileStream( { fileId: req.params.fileId } )

    res.writeHead( 200, { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${fileInfo.fileName}"`,  } )

    fileStream.pipe( res )
  } ),

  app.post( '/api/file/:fileType/:streamId/:branchName?', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    if ( process.env.DISABLE_FILE_UPLOADS ) {
      return res.status( 503 ).send( 'File uploads are disabled on this server' )
    }
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      return res.status( httpErrorCode ).end()
    }

    let fileUploadPromises = []
    let busboy = new Busboy( { headers: req.headers } )
    
    busboy.on( 'file', function( fieldname, file, filename, encoding, mimetype ) {
      let promise = uploadFile( {
        streamId: req.params.streamId,
        branchName: req.params.branchName || '',
        userId: req.context.userId,
        fileName: filename,
        fileType: req.params.fileType,
        fileStream: file
      } )
      fileUploadPromises.push( promise )
    } )

    busboy.on( 'finish', async function() {
      let fileIds = []

      for ( let promise of fileUploadPromises )
      {
        let fileId = await promise
        fileIds.push( fileId )
      }
      res.send( fileIds )
    } )
    req.pipe( busboy )
  } )
}

exports.finalize = () => {}
