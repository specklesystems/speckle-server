import { Router } from 'express'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { createBusboy } from '@/modules/blobstorage/rest/busboy'
import { processNewFileStreamFactory } from '@/modules/blobstorage/services/streams'
import { UnauthorizedError } from '@/modules/shared/errors'
import { ensureError, Nullable } from '@speckle/shared'
import { UploadRequestErrorMessage } from '@/modules/fileuploads/helpers/rest'
import { getEventBus } from '@/modules/shared/services/eventBus'

export const fileuploadRouterFactory = (): Router => {
  const processNewFileStream = processNewFileStreamFactory()

  const app = Router()

  app.post(
    '/api/file/:fileType/:streamId/:branchName?',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    async (req, res) => {
      const branchName = req.params.branchName || 'main'
      const projectId = req.params.streamId
      const userId = req.context.userId

      if (!userId) {
        throw new UnauthorizedError('User not authenticated.')
      }
      const logger = req.log.child({
        projectId,
        streamId: projectId, //legacy
        userId,
        branchName
      })

      const projectDb = await getProjectDbClient({ projectId })
      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
        publish,
        emit: getEventBus().emit
      })
      const saveFileUploads = async ({
        uploadResults
      }: {
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
              streamId: projectId,
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
        streamId: projectId,
        userId,
        logger,
        onFinishAllFileUploads: async (uploadResults) => {
          try {
            await saveFileUploads({
              uploadResults
            })
          } catch (err) {
            logger.error(ensureError(err), 'File importer handling error @deprecated')
            res.status(500)
          }
          res.status(201).send({ uploadResults })
        },
        onError: () => {
          res.contentType('application/json')
          res.status(400).end(UploadRequestErrorMessage)
        }
      })

      req.pipe(newFileStreamProcessor)
    }
  )

  return app
}
