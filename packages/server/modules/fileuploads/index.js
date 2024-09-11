/* istanbul ignore file */
const {
  insertNewUploadAndNotifyFactory
} = require('@/modules/fileuploads/services/management')
const request = require('request')
const { streamWritePermissions } = require('@/modules/shared/authz')
const { authMiddlewareCreator } = require('@/modules/shared/middleware')
const { moduleLogger } = require('@/logging/logging')
const {
  listenForImportUpdatesFactory
} = require('@/modules/fileuploads/services/resultListener')
const {
  getFileInfoFactory,
  saveUploadFileFactory
} = require('@/modules/fileuploads/repositories/fileUploads')
const { db } = require('@/db/knex')
const { publish } = require('@/modules/shared/utils/subscriptions')
const { getStreamBranchByName } = require('@/modules/core/repositories/branches')

const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
  getStreamBranchByName,
  saveUploadFile: saveUploadFileFactory({ db }),
  publish
})

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

exports.init = async (app, isInitial) => {
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
      const branchName = req.params.branchName || 'main'
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

  if (isInitial) {
    const listenForImportUpdates = listenForImportUpdatesFactory({
      getFileInfo: getFileInfoFactory({ db }),
      publish,
      getStreamBranchByName
    })

    listenForImportUpdates()
  }
}

exports.finalize = () => {}
