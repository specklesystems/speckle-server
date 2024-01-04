/* istanbul ignore file */
import { insertNewUploadAndNotify } from '@/modules/fileuploads/services/management'
import request from 'request'
import { streamWritePermissions } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { moduleLogger } from '@/logging/logging'
import { listenForImportUpdates } from '@/modules/fileuploads/services/resultListener'
import type { Application } from 'express'
import { isFileUploadsEnabled } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const saveFileUploads = async ({
  userId,
  streamId,
  branchName,
  uploadResults
}: {
  userId: string
  streamId: string
  branchName: string
  uploadResults: { blobId: string; fileName: string; fileSize: number }[]
}) => {
  await Promise.all(
    uploadResults.map(async (upload) => {
      await insertNewUploadAndNotify({
        fileId: upload.blobId,
        streamId,
        branchName,
        userId,
        fileName: upload.fileName,
        fileType: upload.fileName.split('.').pop() || 'UNKNOWN',
        fileSize: upload.fileSize
      })
    })
  )
}

export = {
  init: async (app: Application) => {
    if (!isFileUploadsEnabled()) {
      moduleLogger.warn('📄 FileUploads module is DISABLED')
      return
    }

    moduleLogger.info('📄 Init FileUploads module')

    app.post(
      '/api/file/:fileType/:streamId/:branchName?',
      authMiddlewareCreator(streamWritePermissions),
      async (req, res) => {
        if (!req.context.userId) {
          res.status(401).send('Unauthorized')
          return
        }
        const userId = req.context.userId
        const branchName = req.params.branchName || 'main'
        req.log = req.log.child({
          streamId: req.params.streamId,
          userId,
          branchName
        })
        req.pipe(
          request(
            `${process.env.CANONICAL_URL}/api/stream/${req.params.streamId}/blob`,
            async (err, response, body) => {
              if (err) {
                req.log.error(err, 'Error while uploading blob.')
                res.status(500).send(err.message)
                return
              }
              if (response.statusCode === 201) {
                const { uploadResults } = JSON.parse(body)
                await saveFileUploads({
                  userId,
                  streamId: req.params.streamId,
                  branchName,
                  uploadResults
                })
              } else {
                req.log.error(
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
} as SpeckleModule
