/* istanbul ignore file */
const {
  insertNewUploadAndNotify
} = require('@/modules/fileuploads/services/management')
const request = require('request')
const { streamWritePermissions } = require('@/modules/shared/authz')
const { authMiddlewareCreator } = require('@/modules/shared/middleware')
const { moduleLogger } = require('@/logging/logging')
const {
  listenForImportUpdates
} = require('@/modules/fileuploads/services/resultListener')

const saveFileUploads = async ({ userId, streamId, branchName, uploadResults }) => {
  await Promise.all(
    uploadResults.map(async (upload) => {
      await insertNewUploadAndNotify({
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
      const branchName = (req.params.branchName || 'main').toLowerCase()
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName
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
                branchName,
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

  listenForImportUpdates()
}

exports.finalize = () => {}
