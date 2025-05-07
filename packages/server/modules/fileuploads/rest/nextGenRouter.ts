import { Router } from 'express'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { db } from '@/db/knex'
import { publish } from '@/modules/shared/utils/subscriptions'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { fileImportResultPayload } from '@speckle/shared/dist/esm/workers/fileimport/job.js'
import { onFileImportResultFactory } from '@/modules/fileuploads/services/resultHandler'
import { getFileIdFromJobIdFactory, updateFileStatusFactory } from '@/modules/fileuploads/repositories/fileUploads'

export const nextGenFileImporterRouterFactory = (): Router => {
  const app = Router()

  app.post(
    '/api/projects/:projectId/fileimporter/jobs',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    (_, res) => {
      // handle the file and save in blob storage
      // create a new job in the database
      // queue the job for processing by the file import service

      res.status(501).send({
        error: 'This endpoint is not implemented yet.'
      })
    }
  )

  app.post(
    '/api/projects/:projectId/fileimporter/jobs/:jobId/results',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ),
    async (req, res) => {
      const userId = req.context.userId
      const projectId = req.params.projectId
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
        res.status(400).send({
          error: 'Invalid job result format'
        })
        return
      }
      const jobResult = parseJobOutput.data

      const projectDb = await getProjectDbClient({ projectId })

      const onFileImportResult = onFileImportResultFactory({
        logger: logger.child({ fileUploadStatus: jobResult.status }),
        getFileIdFromJobId: getFileIdFromJobIdFactory({ db: projectDb }),
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
