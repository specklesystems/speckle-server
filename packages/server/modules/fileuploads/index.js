/* istanbul ignore file */
'use strict'

const debug = require('debug')
const Busboy = require('busboy')

const {
  contextMiddleware,
  validateScopes,
  authorizeResolver
} = require('@/modules/shared')

const {
  checkBucket,
  startUploadFile,
  finishUploadFile,
  getFileInfo,
  getFileStream
} = require('./services/fileuploads')
const { getStream } = require('../core/services/streams')

exports.init = async (app) => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    debug('speckle:modules')('📄 FileUploads module is DISABLED')
    return
  } else {
    debug('speckle:modules')('📄 Init FileUploads module')
  }

  if (!process.env.S3_BUCKET) {
    debug('speckle:modules')(
      'ERROR: S3_BUCKET env variable was not specified. File uploads will be DISABLED.'
    )
    return
  }

  await checkBucket()

  const checkStreamPermissions = async (req) => {
    if (!req.context || !req.context.auth) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    try {
      await validateScopes(req.context.scopes, 'streams:write')
    } catch (err) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    try {
      await authorizeResolver(
        req.context.userId,
        req.params.streamId,
        'stream:contributor'
      )
    } catch (err) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    return { hasPermissions: true, httpErrorCode: 200 }
  }

  app.get('/api/file/:fileId', contextMiddleware, async (req, res) => {
    if (process.env.DISABLE_FILE_UPLOADS) {
      return res.status(503).send('File uploads are disabled on this server')
    }

    const fileInfo = await getFileInfo({ fileId: req.params.fileId })

    if (!fileInfo) return res.status(404).send('File not found')

    // Check stream read access
    const streamId = fileInfo.streamId
    const stream = await getStream({ streamId, userId: req.context.userId })

    if (!stream) {
      return res.status(404).send('File stream not found')
    }

    if (!stream.isPublic && req.context.auth === false) {
      return res.status(401).send('You must be logged in to access private streams')
    }

    if (!stream.isPublic) {
      try {
        await validateScopes(req.context.scopes, 'streams:read')
      } catch (err) {
        return res.status(401).send("The provided auth token can't read streams")
      }

      try {
        await authorizeResolver(req.context.userId, streamId, 'stream:reviewer')
      } catch (err) {
        return res.status(401).send("You don't have access to this private stream")
      }
    }

    const fileStream = await getFileStream({ fileId: req.params.fileId })

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileInfo.fileName}"`
    })

    fileStream.pipe(res)
  }),
    app.post(
      '/api/file/:fileType/:streamId/:branchName?',
      contextMiddleware,
      async (req, res) => {
        if (process.env.DISABLE_FILE_UPLOADS) {
          return res.status(503).send('File uploads are disabled on this server')
        }
        const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
        if (!hasPermissions) {
          return res.status(httpErrorCode).end()
        }

        const fileUploadPromises = []
        const busboy = Busboy({ headers: req.headers })

        busboy.on('file', (name, file, info) => {
          const { filename } = info
          let fileType = req.params.fileType
          if (fileType === 'autodetect')
            fileType = filename.split('.').pop().toLowerCase()

          const promise = startUploadFile({
            streamId: req.params.streamId,
            branchName: req.params.branchName || '',
            userId: req.context.userId,
            fileName: filename,
            fileType,
            fileStream: file
          })
          fileUploadPromises.push(promise)
        })

        busboy.on('finish', async function () {
          const fileIds = []

          for (const promise of fileUploadPromises) {
            const fileId = await promise
            fileIds.push(fileId)
          }
          for (const fileId of fileIds) {
            await finishUploadFile({ fileId })
          }
          res.send(fileIds)
        })

        busboy.on('error', async (err) => {
          console.log(`FileUpload error: ${err}`)
          res.status(400).end('Upload request error. The server logs have more details')
        })

        req.pipe(busboy)
      }
    )
}

exports.finalize = () => {}
