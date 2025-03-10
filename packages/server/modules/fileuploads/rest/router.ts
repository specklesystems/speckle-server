import { Router } from 'express'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { createBusboy } from '@/modules/blobstorage/rest/busboy'
import { processNewFileStreamFactory } from '@/modules/blobstorage/services/streams'
import { UnauthorizedError } from '@/modules/shared/errors'
import { Nullable } from '@speckle/shared'
import { pipeline } from 'stream'

export const fileuploadRouterFactory = (): Router => {
  const processNewFileStream = processNewFileStreamFactory()

  const app = Router()

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getRoles: getRolesFactory({ db }),
        getStream: getStreamFactory({ db })
      })
    ),
    async (req, res) => {
      const branchName = req.params.branchName || 'main'
      const streamId = req.params.streamId
      const userId = req.context.userId
      if (!userId) {
        throw new UnauthorizedError('User not authenticated.')
      }
      const logger = req.log.child({
        streamId,
        userId,
        branchName
      })

      const projectDb = await getProjectDbClient({ projectId: streamId })
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
          fileSize: Nullable<number>
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
              fileType: upload.fileName?.split('.').pop() || '', //FIXME
              fileSize: upload.fileSize
            })
          })
        )
      }

      const busboy = createBusboy(req)
      const newFileStreamProcessor = await processNewFileStream({
        busboy,
        streamId,
        userId,
        logger,
        onFinishAllFileUploads: async (uploadResults) => {
          await saveFileUploads({
            userId,
            streamId,
            branchName,
            uploadResults
          })
          res.status(201).send({ uploadResults })
        },
        onError: () => {
          res.contentType('application/json')
          res
            .status(400)
            .end(
              '{ "error": "Upload request error. The server logs may have more details." }'
            )
        }
      })

      pipeline(req, newFileStreamProcessor)
    }
  )

  return app
}
