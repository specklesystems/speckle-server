import { getModelByIdFactory } from '@/modules/core/repositories/models'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { createUploadFileFactory } from '@/modules/fileuploads/services/management'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getPort } from '@/modules/shared/helpers/envHelper'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { publish } from '@/modules/shared/utils/subscriptions'
import type { Express } from 'express'
import { Knex } from 'knex'
import request from 'request'

export const modelsRouter = (app: Express, db: Knex): void => {
  app.post(
    '/api/file/:fileType/projects/:projectId/models/:modelId',
    async (req, res, next) => {
      await authMiddlewareCreator(
        streamWritePermissionsPipelineFactory({
          getRoles: getRolesFactory({ db }),
          getStream: getStreamFactory({ db })
        })
      )(req, res, next)
    },
    async (req, res) => {
      const modelId = req.params.modelId
      const projectId = req.params.projectId
      req.log = req.log.child({
        streamId: req.params.projectId,
        userId: req.context.userId,
        modelId
      })

      const projectDb = await getProjectDbClient({ projectId: req.params.projectId })
      const createUploadFile = createUploadFileFactory({
        getModelById: getModelByIdFactory({ db: projectDb }),
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
        publish
      })
      const saveFileUploads = async ({
        userId,
        projectId,
        modelId,
        uploadResults
      }: {
        userId: string
        projectId: string
        modelId: string
        uploadResults: Array<{
          blobId: string
          fileName: string
          fileSize: number
        }>
      }) => {
        await Promise.all(
          uploadResults.map(async (upload) => {
            await createUploadFile({
              projectId,
              modelId,
              userId,
              upload: {
                fileId: upload.blobId,
                fileName: upload.fileName,
                fileType: upload.fileName.split('.').pop()!,
                fileSize: upload.fileSize
              }
            })
          })
        )
      }
      //TODO refactor packages/server/modules/blobstorage/index.js to use the service pattern, and then refactor this to call the service directly from here without the http overhead
      const pipedReq = request(
        // we call this same server on localhost (IPv4) to upload the blob and do not make an external call
        `http://127.0.0.1:${getPort()}/api/stream/${req.params.projectId}/blob`,
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
              projectId,
              modelId,
              uploadResults
            })
          } else {
            res.log.error(
              {
                statusCode: response.statusCode,
                path: `http://127.0.0.1:${getPort()}/api/stream/${
                  req.params.projectId
                }/blob`
              },
              'Error while uploading file.'
            )
          }
          res.contentType('application/json')
          res.status(response.statusCode).send(body)
        }
      )

      req.pipe(pipedReq)
    }
  )
}
