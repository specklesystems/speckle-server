import { getPort } from '@/modules/shared/helpers/envHelper'
import { Router } from 'express'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import request from 'request'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'

export const getRouter = () => {
  const app = Router()
  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    async (req, res, next) => {
      await authMiddlewareCreator(
        streamWritePermissionsPipelineFactory({
          getRoles: getRolesFactory({ db }),
          getStream: getStreamFactory({ db })
        })
      )(req, res, next)
    },
    async (req, res) => {
      const branchName = req.params.branchName || 'main'
      req.log = req.log.child({
        streamId: req.params.streamId,
        userId: req.context.userId,
        branchName
      })

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
        publish
      })
      const saveFileUploads = async ({
        userId,
        streamId,
        branchName,
        uploadResults
      }: {
        userId: string
        streamId: string
        branchName: string
        uploadResults: Array<{
          blobId: string
          fileName: string
          fileSize: number
        }>
      }) => {
        await Promise.all(
          uploadResults.map(async (upload) => {
            await insertNewUploadAndNotify({
              fileId: upload.blobId,
              streamId,
              branchName,
              userId,
              fileName: upload.fileName,
              fileType: upload.fileName.split('.').pop()!,
              fileSize: upload.fileSize
            })
          })
        )
      }
      //TODO refactor packages/server/modules/blobstorage/index.js to use the service pattern, and then refactor this to call the service directly from here without the http overhead
      const pipedReq = request(
        // we call this same server on localhost (IPv4) to upload the blob and do not make an external call
        `http://127.0.0.1:${getPort()}/api/stream/${req.params.streamId}/blob`,
        async (err, response, body) => {
          if (err) {
            res.log.error(err, 'Error while uploading blob.')
            res.status(500).send(err.message)
            return
          }
          if (response.statusCode === 201) {
            const { uploadResults } = JSON.parse(body)
            await saveFileUploads({
              userId: req.context.userId!,
              streamId: req.params.streamId,
              branchName,
              uploadResults
            })
          } else {
            res.log.error(
              {
                statusCode: response.statusCode,
                path: `http://127.0.0.1:${getPort()}/api/stream/${
                  req.params.streamId
                }/blob`
              },
              'Error while uploading file.'
            )
          }
          res.contentType('application/json')
          res.status(response.statusCode).send(body)
        }
      )

      req.pipe(pipedReq as unknown as NodeJS.WritableStream)
    }
  )
  return app
}
