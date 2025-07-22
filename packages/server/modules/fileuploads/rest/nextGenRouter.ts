import { Router } from 'express'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { db } from '@/db/knex'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { fileImportResultPayload } from '@speckle/shared/workers/fileimport'
import { onFileImportResultFactory } from '@/modules/fileuploads/services/resultHandler'
import {
  getFileInfoFactoryV2,
  updateFileUploadFactory
} from '@/modules/fileuploads/repositories/fileUploads'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { getEventBus } from '@/modules/shared/services/eventBus'

export const nextGenFileImporterRouterFactory = (): Router => {
  const app = Router()

  app.post(
    '/api/projects/:streamId/fileimporter/jobs/:jobId/results',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    validateRequest({
      params: z.object({
        streamId: z.string(),
        jobId: z.string()
      }),
      body: fileImportResultPayload
    }),
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

      const jobResult = req.body
      const projectDb = await getProjectDbClient({ projectId })

      const onFileImportResult = onFileImportResultFactory({
        logger: logger.child({ fileUploadStatus: jobResult.status }),
        updateFileUpload: updateFileUploadFactory({ db: projectDb }),
        getFileInfo: getFileInfoFactoryV2({ db: projectDb }),
        eventEmit: getEventBus().emit
      })

      await onFileImportResult({
        jobId,
        jobResult
      })

      res.status(200).send({
        message: 'Job result processed successfully'
      })
      return
    }
  )
  return app
}
