/* istanbul ignore file */
'use strict'

const debug = require( 'debug' )
const express = require( 'express' )
const appRoot = require( 'app-root-path' )
const Busboy = require( 'busboy' )

const cors = require( 'cors' )
const { matomoMiddleware } = require( `${appRoot}/logging/matomoHelper` )
const { contextMiddleware, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

const { uploadFile } = require( './services/fileuploads' )

exports.init = async ( app, options ) => {
  if ( process.env.DISABLE_FILE_UPLOADS ) {
    debug( 'speckle:modules' )( '📄 FileUploads module is DISABLED' )
  } else {
    debug( 'speckle:modules' )( '📄 Init FileUploads module' )
  }

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

  app.post( '/api/upload_file/:fileType/:streamId', contextMiddleware, matomoMiddleware, async ( req, res ) => {
    if ( process.env.DISABLE_FILE_UPLOADS ) {
      return res.status( 503 ).send( 'File uploads are disabled on this server' )
    }
    let { hasPermissions, httpErrorCode } = await checkStreamPermissions( req )
    if ( !hasPermissions ) {
      return res.status( httpErrorCode ).end()
    }

    var busboy = new Busboy( { headers: req.headers } )
    busboy.on( 'file', async function( fieldname, file, filename, encoding, mimetype ) {
      let promise = uploadFile( {
        streamId: req.params.streamId,
        userId: req.context.userId,
        fileName: filename,
        fileType: req.params.fileType,
        fileStream: file
      } )

      await promise
    } )
    busboy.on( 'finish', function() {
      res.writeHead( 200, 'OK' )
      res.end()
    } )
    req.pipe( busboy )
  } )
}

exports.finalize = () => {}
