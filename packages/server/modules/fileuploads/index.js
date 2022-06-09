/* istanbul ignore file */
'use strict'

const debug = require('debug')
const {
  contextMiddleware,
  validateScopes,
  authorizeResolver
} = require('@/modules/shared')
const { Roles, Scopes } = require('@/modules/core/helpers/mainConstants')
const {
  checkBucket,
  startUploadFile,
  finishUploadFile,
  getFileInfo,
  getFileStream
} = require('./services/fileuploads')
const { getStream } = require('../core/services/streams')
const request = require('request')
const {
  authMiddlewareCreator,
  validateServerRole,
  validateStreamRole,
  validateScope,
  contextRequiresStream
} = require('@/modules/shared/authz')

const permissions = [
  validateServerRole({ requiredRole: Roles.Server.User }),
  validateScope({ requiredScope: Scopes.Streams.Write }),
  contextRequiresStream(getStream)
]
const writePermissions = [
  ...permissions,
  validateStreamRole({ requiredRole: Roles.Stream.Contributor })
]
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
  })
  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    contextMiddleware,
    authMiddlewareCreator(writePermissions),
    async (req, res) => {
      req.pipe(
        request(
          `${process.env.CANONICAL_URL}/api/stream/${req.params.streamId}/blob`,
          async (err, response, body) => {
            if (response.statusCode === 201) {
              const { uploadResults } = JSON.parse(body)
              await Promise.all(
                uploadResults.map(async (upload) => {
                  await startUploadFile({
                    fileId: upload.fileId,
                    streamId: req.params.streamId,
                    branchName: req.params.branchName || '',
                    userId: req.context.userId,
                    fileName: upload.fileName,
                    fileType: upload.fileName.split('.').pop()
                  })
                  await finishUploadFile(upload)
                })
              )
            }
            res.status(response.statusCode).send(body)
          }
        )
      )
      // const client = new Client(process.env.CANONICAL_URL)
      // const response = pipeline(
      //   req,
      //   client.pipeline(
      //     {
      //       path: `/api/stream/${req.params.streamId}/blob`,
      //       method: 'POST',
      //       headers: req.headers
      //     },
      //     ({ statusCode, body }) => {
      //       if (statusCode !== 201) {
      //         throw new Error('invalid response')
      //       }

      //       return body
      //     }
      //   ),
      //   // res,
      //   (err) => {
      //     if (err) {
      //       console.error('failed', err.message)
      //     } else {
      //       console.log('succeeded')
      //     }
      //   }
      // )
      // response.on('readable', async () => {
      //   const { uploadResults } = response.read()
      //   await Promise.all(
      //     uploadResults.map(async (upload) => {
      //       await startUploadFile({
      //         fileId: upload.fileId,
      //         streamId: req.params.streamId,
      //         branchName: req.params.branchName || '',
      //         userId: req.context.userId,
      //         fileName: upload.fileName,
      //         fileType: upload.fileName.split('.').pop()
      //       })
      //       await finishUploadFile(upload)
      //     })
      //   )
      // })
      // res.status(201).send(body)
    }
  )
}

exports.finalize = () => {}
