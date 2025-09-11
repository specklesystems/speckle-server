import { Router } from 'express'
import { insertNewUploadAndNotifyFactory } from '@/modules/fileuploads/services/management'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { saveUploadFileFactory } from '@/modules/fileuploads/repositories/fileUploads'
import { db } from '@/db/knex'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { createBusboy } from '@/modules/blobstorage/rest/busboy'
import { processNewFileStreamFactory } from '@/modules/blobstorage/services/streams'
import { UnauthorizedError } from '@/modules/shared/errors'
import type { Nullable } from '@speckle/shared'
import { ensureError } from '@speckle/shared'
import { UploadRequestErrorMessage } from '@/modules/fileuploads/helpers/rest'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { pushJobToFileImporterFactory } from '@/modules/fileuploads/services/createFileImport'
import {
  fileImportServiceShouldUsePrivateObjectsServerUrl,
  getPrivateObjectsServerOrigin,
  getServerOrigin
} from '@/modules/shared/helpers/envHelper'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import { findQueue } from '@/modules/fileuploads/queues/fileimports'
import { BranchNotFoundError } from '@/modules/core/errors/branch'

const pushJobToFileImporter = pushJobToFileImporterFactory({
  getServerOrigin: fileImportServiceShouldUsePrivateObjectsServerUrl()
    ? getPrivateObjectsServerOrigin
    : getServerOrigin,
  createAppToken: createAppTokenFactory({
    storeApiToken: storeApiTokenFactory({ db }),
    storeTokenScopes: storeTokenScopesFactory({ db }),
    storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
      db
    }),
    storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
  })
})

export const fileuploadRouterFactory = (): Router => {
  const processNewFileStream = processNewFileStreamFactory()

  const app = Router()

  /**
   * @deprecated use POST /graphql (mutation.fileUploadMutations.generateUploadUrl), then PUT (to the provided url), then POST /graphql (mutation.fileUploadMutations.startFileImport)
   */
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
      const getStreamBranchByName = getStreamBranchByNameFactory({ db: projectDb })
      const branch = await getStreamBranchByName(projectId, branchName)
      if (!branch) {
        throw new BranchNotFoundError(
          'The branch was not found. The client is now expected to create the branch before attempting to upload files to a branch.'
        )
      }

      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactory({
        findQueue,
        pushJobToFileImporter,
        saveUploadFile: saveUploadFileFactory({ db: projectDb }),
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
              projectId,
              userId,
              fileName: upload.fileName,
              fileType: upload.fileName?.split('.').pop() || '', //FIXME
              fileSize: upload.fileSize,
              modelId: branch.id,
              modelName: branchName
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

          res.setHeader(
            'Warning',
            'Deprecated API; use POST /graphql (mutation.fileUploadMutations.generateUploadUrl), then PUT (to the provided url), then POST /graphql (mutation.fileUploadMutations.startFileImport)'
          )

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
