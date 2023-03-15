/* istanbul ignore file */
'use strict'

const { saveUploadFile } = require('./services/fileuploads')
const request = require('request')
const { streamWritePermissions } = require('@/modules/shared/authz')
const { authMiddlewareCreator } = require('@/modules/shared/middleware')
const { moduleLogger } = require('@/logging/logging')

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
    authMiddlewareCreator(streamWritePermissions),
    async (req, res) => {
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName: req.params.branchName ?? 'main'
      })
      req.pipe(
        request(
          `${process.env.CANONICAL_URL}/api/stream/${req.params.streamId}/blob`,
          async (err, response, body) => {
            if (err) {
              res.log.error(err, 'Error while uploading blob.')
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
            } else {
              res.log.error(
                {
                  statusCode: response.statusCode,
                  path: `${process.env.CANONICAL_URL}/api/stream/${req.params.streamId}/blob`
                },
                'Error while uploading file.'
              )
            }
            res.status(response.statusCode).send(body)
          }
        )
      )
    }
  )
}

exports.finalize = () => {}
