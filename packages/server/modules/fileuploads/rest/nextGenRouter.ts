import { Router } from 'express'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { fileImportResultPayload } from '@speckle/shared/workers/fileimport'
import { onFileImportResultFactory } from '@/modules/fileuploads/services/resultHandler'
import {
  saveUploadFileFactoryV2,
  updateFileStatusFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { FileImportInvalidJobResultPayload } from '@/modules/fileuploads/helpers/errors'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { processNewFileStreamFactory } from '@/modules/blobstorage/services/streams'
import { UnauthorizedError } from '@/modules/shared/errors'
import { getBranchesByIdsFactory } from '@/modules/core/repositories/branches'
import { insertNewUploadAndNotifyFactoryV2 } from '@/modules/fileuploads/services/management'
import { UploadResult } from '@/modules/blobstorage/domain/types'
import { createBusboy } from '@/modules/blobstorage/rest/busboy'
import { UploadRequestErrorMessage } from '@/modules/fileuploads/helpers/rest'
import { ensureError } from '@speckle/shared'

export const nextGenFileImporterRouterFactory = (): Router => {
  const processNewFileStream = processNewFileStreamFactory()
  const app = Router()

  app.post(
    '/api/projects/:streamId/fileimporter/jobs',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    validateRequest({
      query: z.object({
        modelId: z.string()
      })
    }),
    async (req, res) => {
      const projectId = req.params.streamId
      const modelId = req.query.modelId
      const userId = req.context.userId

      if (!userId) throw new UnauthorizedError('User not authorized')

      const logger = req.log.child({
        projectId,
        modelId,
        userId
      })

      const projectDb = await getProjectDbClient({ projectId })
      const getModelsByIds = getBranchesByIdsFactory({ db: projectDb })
      const [model] = await getModelsByIds([modelId], { streamId: projectId })
      if (!model) throw new UnauthorizedError()

      const insertNewUploadAndNotify = insertNewUploadAndNotifyFactoryV2({
        saveUploadFile: saveUploadFileFactoryV2({ db: projectDb }),
        publish
      })

      const storeFileResultsAsFileUploads = async (data: UploadResult[]) => {
        await Promise.all(
          data.map(async (result) => {
            await insertNewUploadAndNotify({
              projectId,
              modelId,
              userId,
              fileId: result.blobId,
              fileName: result.fileName,
              fileType: result.fileName?.split('.').pop() || '', //FIXME
              fileSize: result.fileSize
            })
          })
        )
      }

      const onError = () => {
        res.contentType('application/json')
        res.status(400).end(UploadRequestErrorMessage)
      }

      const onFinishAllFileUploads = async (uploadResults: UploadResult[]) => {
        try {
          await storeFileResultsAsFileUploads(uploadResults)
          res.status(201).send({ uploadResults })
        } catch (err) {
          logger.error(ensureError(err), 'File importer handling error')
          onError()
        }
      }

      const busboy = createBusboy(req)
      const newFileStreamProcessor = await processNewFileStream({
        busboy,
        streamId: projectId,
        userId,
        logger,
        onFinishAllFileUploads,
        onError
      })

      req.pipe(newFileStreamProcessor)
    }
  )

  app.post(
    '/api/projects/:streamId/fileimporter/jobs/:jobId/results',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    async (req, res) => {
      const userId = req.context.userId
      const projectId = req.params.streamId
      const jobId = req.params.jobId
      const logger = req.log.child({
        projectId,
        streamId: projectId, //legacy
        userId,
        jobId
      })

      const parseJobOutput = fileImportResultPayload.safeParse(req.body)
      if (!parseJobOutput.success) {
        logger.error(
          { err: parseJobOutput.error.format() },
          'Error parsing file import job result'
        )
        throw new FileImportInvalidJobResultPayload(parseJobOutput.error.message)
      }
      const jobResult = parseJobOutput.data

      const projectDb = await getProjectDbClient({ projectId })

      const onFileImportResult = onFileImportResultFactory({
        logger: logger.child({ fileUploadStatus: jobResult.status }),
        updateFileStatus: updateFileStatusFactory({ db: projectDb }),
        publish
      })

      await onFileImportResult({ jobId, jobResult })

      res.status(200).send({
        message: 'Job result processed successfully'
      })
      return
    }
  )
  return app
}
