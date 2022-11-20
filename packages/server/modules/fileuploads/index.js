/* istanbul ignore file */
'use strict'

const { contextMiddleware } = require('@/modules/shared')
const { saveUploadFile } = require('./services/fileuploads')
const request = require('request')
const {
  authMiddlewareCreator,
  streamWritePermissions
} = require('@/modules/shared/authz')
const { moduleLogger, Logger } = require('@/logging/logging')

const saveFileUploads = async ({ userId, streamId, branchName, uploadResults }) => {
  await Promise.all(
    uploadResults.map(async (upload) => {
      await saveUploadFile({
        fileId: upload.blobId,
        streamId,
        branchName,
        userId,
        fileName: upload.fileName,
        fileType: upload.fileName.split('.').pop(),
        fileSize: upload.fileSize
      })
    })
  )
}

exports.init = async (app) => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  } else {
    moduleLogger.info('📄 Init FileUploads module')
  }

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    contextMiddleware,
    authMiddlewareCreator(streamWritePermissions),
    async (req, res) => {
      req.pipe(
        request(
          `${process.env.CANONICAL_URL}/api/stream/${req.params.streamId}/blob`,
          async (err, response, body) => {
            if (err) {
              Logger.error(err)
              res.status(500).send(err.message)
              return
            }
            if (response.statusCode === 201) {
              const { uploadResults } = JSON.parse(body)
              await saveFileUploads({
                userId: req.context.userId,
                streamId: req.params.streamId,
                branchName: req.params.branchName ?? 'main',
                uploadResults
              })
            }
            res.status(response.statusCode).send(body)
          }
        )
      )
    }
  )
}

exports.finalize = () => {}
