/* istanbul ignore file */
import { insertNewUploadAndNotify } from '@/modules/fileuploads/services/management'
import { streamWritePermissions } from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { moduleLogger } from '@/logging/logging'
import { listenForImportUpdates } from '@/modules/fileuploads/services/resultListener'
import axios, { AxiosResponse } from 'axios'
import {
  getIgnoreMissingMigrations,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { Express } from 'express'

type saveFileUploadsParams = {
  userId: string
  streamId: string
  branchName: string
  uploadResults: { fileName: string; fileSize: number; blobId: string }[]
}

const saveFileUploads = async ({
  userId,
  streamId,
  branchName,
  uploadResults
}: saveFileUploadsParams) => {
  await Promise.all(
    uploadResults.map(async (upload) => {
      await insertNewUploadAndNotify({
        fileId: upload.blobId,
        streamId,
        branchName,
        userId,
        fileName: upload.fileName,
        fileType: upload.fileName.split('.').pop() || '',
        fileSize: upload.fileSize
      })
    })
  )
}

export const init = async (app: Express) => {
  if (getIgnoreMissingMigrations()) {
    moduleLogger.warn('📄 FileUploads module is DISABLED')
    return
  } else {
    moduleLogger.info('📄 Init FileUploads module')
  }

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    authMiddlewareCreator(streamWritePermissions),
    async (req, res) => {
      if (!req.context.userId) {
        res.status(401).send('Unauthorized. UserId is missing.')
        return
      }
      const branchName = req.params.branchName || 'main'
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName
      })

      let upstreamResponse: AxiosResponse
      try {
        upstreamResponse = await axios.post(
          `${getServerOrigin()}/api/stream/${req.params.streamId}/blob`,
          req,
          {
            responseType: 'stream'
          }
        )
        upstreamResponse.data.pipe(res) //stream response from upstream endpoint back to the client
      } catch (err) {
        req.log.error(err, 'Error while uploading blob.')
        if (err instanceof Error) {
          res.status(500).send(err.message)
        } else {
          res.status(500).send('Error while uploading blob.')
        }
        return
      }

      if (upstreamResponse.status !== 201) {
        // handle error
        req.log.error(
          {
            statusCode: upstreamResponse.status,
            path: `${getServerOrigin()}/api/stream/${req.params.streamId}/blob`
          },
          'Error while uploading file.'
        )
        res.status(upstreamResponse.status).end() // upstream response data should have been streamed
        return
      }

      const uploadedData = JSON.parse(upstreamResponse.data)
      const uploadResults = uploadedData.uploadResults
      await saveFileUploads({
        userId: req.context.userId,
        streamId: req.params.streamId,
        branchName,
        uploadResults
      })
      res.status(upstreamResponse.status).end() // upstream response data should have been streamed
    }
  )

  listenForImportUpdates()
}

export const finalize = () => {}
