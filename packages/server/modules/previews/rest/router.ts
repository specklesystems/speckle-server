import { Router } from 'express'
import cors from 'cors'
import { validateScopes, authorizeResolver } from '@/modules/shared'
import { makeOgImage } from '@/modules/previews/ogImage'
import { db } from '@/db/knex'
import {
  getObjectPreviewBufferOrFilepathFactory,
  sendObjectPreviewFactory,
  checkStreamPermissionsFactory
} from '@/modules/previews/services/management'
import {
  getObjectPreviewInfoFactory,
  getPreviewImageFactory,
  storeObjectPreviewFactory,
  storePreviewFactory,
  updateObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import {
  getCommitFactory,
  getObjectCommitsWithStreamIdsFactory,
  getPaginatedBranchCommitsItemsFactory,
  legacyGetPaginatedStreamCommitsPageFactory
} from '@/modules/core/repositories/commits'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import { getPaginatedBranchCommitsItemsByNameFactory } from '@/modules/core/services/commit/retrieval'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getFormattedObjectFactory } from '@/modules/core/repositories/objects'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { createObjectPreviewFactory } from '@/modules/previews/services/createObjectPreview'
import { createAppTokenFactory } from '@/modules/core/services/tokens'
import {
  storeApiTokenFactory,
  storeTokenResourceAccessDefinitionsFactory,
  storeTokenScopesFactory,
  storeUserServerAppTokenFactory
} from '@/modules/core/repositories/tokens'
import {
  getPrivateObjectsServerOrigin,
  getServerOrigin,
  previewServiceShouldUsePrivateObjectsServerUrl
} from '@/modules/shared/helpers/envHelper'
import { requestObjectPreviewFactory } from '@/modules/previews/queues/previews'
import type { Queue } from 'bull'
import type { Knex } from 'knex'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { streamWritePermissionsPipelineFactory } from '@/modules/shared/authz'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { fromJobId, previewResultPayload } from '@speckle/shared/workers/previews'
import { observeMetricsFactory } from '@/modules/previews/observability/metrics'
import { Summary } from 'prom-client'
import { consumePreviewResultFactory } from '@/modules/previews/resultListener'
import { ensureError } from '@speckle/shared'
import { StreamNotFoundError } from '@/modules/core/errors/stream'

const httpErrorImage = (httpErrorCode: number) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

const buildCreateObjectPreviewFunction = ({
  projectDb,
  previewRequestQueue
}: {
  projectDb: Knex
  previewRequestQueue: Queue
}) => {
  return createObjectPreviewFactory({
    requestObjectPreview: requestObjectPreviewFactory({
      queue: previewRequestQueue
    }),
    // use the private server origin if defined, otherwise use the public server origin
    serverOrigin: previewServiceShouldUsePrivateObjectsServerUrl()
      ? getPrivateObjectsServerOrigin()
      : getServerOrigin(),
    storeObjectPreview: storeObjectPreviewFactory({ db: projectDb }),
    getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
    createAppToken: createAppTokenFactory({
      storeApiToken: storeApiTokenFactory({ db }),
      storeTokenScopes: storeTokenScopesFactory({ db }),
      storeTokenResourceAccessDefinitions: storeTokenResourceAccessDefinitionsFactory({
        db
      }),
      storeUserServerAppToken: storeUserServerAppTokenFactory({ db })
    })
  })
}

export const previewRouterFactory = ({
  previewRequestQueue,
  previewJobsProcessedSummary
}: {
  previewRequestQueue: Queue
  previewJobsProcessedSummary: Summary<'status' | 'step'>
}): Router => {
  const app = Router()

  app.options('/preview/:streamId/:angle?', cors())
  app.get('/preview/:streamId/:angle?', cors(), async (req, res) => {
    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
    const checkStreamPermissions = checkStreamPermissionsFactory({
      validateScopes,
      authorizeResolver,
      // getting the stream from the main DB, cause it needs to join on roles
      getStream: getStreamFactory({ db })
    })
    const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile(httpErrorImage(httpErrorCode))
    }

    const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({
      db: projectDb
    })

    const { commits } = await getCommitsByStreamId({
      streamId: req.params.streamId,
      limit: 1,
      ignoreGlobalsBranch: true,
      cursor: undefined
    })
    if (!commits || commits.length === 0) {
      return res.sendFile(noPreviewImage)
    }
    const lastCommit = commits[0]
    const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
      logger: req.log,
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: buildCreateObjectPreviewFunction({
        projectDb,
        previewRequestQueue
      }),
      getPreviewImage: getPreviewImageFactory({ db: projectDb })
    })

    const sendObjectPreview = sendObjectPreviewFactory({
      // getting the stream from the projectDb here, to handle preview data properly
      getStream: getStreamFactory({ db: projectDb }),
      getObjectPreviewBufferOrFilepath,
      makeOgImage
    })

    return sendObjectPreview(
      req,
      res,
      req.params.streamId,
      lastCommit.referencedObject,
      req.params.angle
    )
  })

  app.options('/preview/:streamId/branches/:branchName/:angle?', cors())
  app.get(
    '/preview/:streamId/branches/:branchName/:angle?',
    cors(),
    async (req, res) => {
      const checkStreamPermissions = checkStreamPermissionsFactory({
        validateScopes,
        authorizeResolver,
        // getting the stream from the main DB, cause it needs to join on roles
        getStream: getStreamFactory({ db })
      })
      const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
      if (!hasPermissions) {
        // return res.status( httpErrorCode ).end()
        return res.sendFile(httpErrorImage(httpErrorCode))
      }

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

      let commitsObj
      try {
        const getCommitsByBranchName = getPaginatedBranchCommitsItemsByNameFactory({
          getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
          getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({
            db: projectDb
          })
        })
        commitsObj = await getCommitsByBranchName({
          streamId: req.params.streamId,
          branchName: req.params.branchName,
          limit: 1,
          cursor: undefined
        })
      } catch {
        commitsObj = {}
      }
      const { commits } = commitsObj
      if (!commits || commits.length === 0) {
        return res.sendFile(noPreviewImage)
      }
      const lastCommit = commits[0]

      const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
        logger: req.log,
        getObject: getFormattedObjectFactory({ db: projectDb }),
        getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
        createObjectPreview: buildCreateObjectPreviewFunction({
          projectDb,
          previewRequestQueue
        }),
        getPreviewImage: getPreviewImageFactory({ db: projectDb })
      })

      const sendObjectPreview = sendObjectPreviewFactory({
        // getting the stream from the projectDb here, to handle preview data properly
        getStream: getStreamFactory({ db: projectDb }),
        getObjectPreviewBufferOrFilepath,
        makeOgImage
      })

      return sendObjectPreview(
        req,
        res,
        req.params.streamId,
        lastCommit.referencedObject,
        req.params.angle
      )
    }
  )

  app.options('/preview/:streamId/commits/:commitId/:angle?', cors())
  app.get('/preview/:streamId/commits/:commitId/:angle?', cors(), async (req, res) => {
    const checkStreamPermissions = checkStreamPermissionsFactory({
      validateScopes,
      authorizeResolver,
      // getting the stream from the main DB, cause it needs to join on roles
      getStream: getStreamFactory({ db })
    })
    const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile(httpErrorImage(httpErrorCode))
    }

    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

    const getCommit = getCommitFactory({ db: projectDb })
    const commit = await getCommit(req.params.commitId, {
      streamId: req.params.streamId
    })
    if (!commit) return res.sendFile(noPreviewImage)

    const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
      logger: req.log,
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: buildCreateObjectPreviewFunction({
        projectDb,
        previewRequestQueue
      }),
      getPreviewImage: getPreviewImageFactory({ db: projectDb })
    })

    const sendObjectPreview = sendObjectPreviewFactory({
      // getting the stream from the projectDb here, to handle preview data properly
      getStream: getStreamFactory({ db: projectDb }),
      getObjectPreviewBufferOrFilepath,
      makeOgImage
    })
    return sendObjectPreview(
      req,
      res,
      req.params.streamId,
      commit.referencedObject,
      req.params.angle
    )
  })

  app.options('/preview/:streamId/objects/:objectId/:angle?', cors())
  app.get('/preview/:streamId/objects/:objectId/:angle?', cors(), async (req, res) => {
    const checkStreamPermissions = checkStreamPermissionsFactory({
      validateScopes,
      authorizeResolver,
      // getting the stream from the main DB, cause it needs to join on roles
      getStream: getStreamFactory({ db })
    })
    const { hasPermissions } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      return res.status(403).end()
    }
    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

    const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
      logger: req.log,
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: buildCreateObjectPreviewFunction({
        projectDb,
        previewRequestQueue
      }),
      getPreviewImage: getPreviewImageFactory({ db: projectDb })
    })

    const sendObjectPreview = sendObjectPreviewFactory({
      // getting the stream from the projectDb here, to handle preview data properly
      getStream: getStreamFactory({ db: projectDb }),
      getObjectPreviewBufferOrFilepath,
      makeOgImage
    })

    return sendObjectPreview(
      req,
      res,
      req.params.streamId,
      req.params.objectId,
      req.params.angle
    )
  })

  app.post(
    '/api/projects/:streamId/previews/jobs/:jobId/results',
    authMiddlewareCreator(
      streamWritePermissionsPipelineFactory({
        //FIXME this should be a new scope stream:previews or similar
        getStream: getStreamFactory({ db })
      })
    ),
    validateRequest({
      params: z.object({
        streamId: z.string(),
        jobId: z.string()
      }),
      body: previewResultPayload
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

      const { objectId, projectId: projectIdFromJobId } = fromJobId(jobId)
      if (projectIdFromJobId !== projectId) {
        logger.error(
          `Project ID from job ID (${projectIdFromJobId}) does not match request project ID (${projectId})`
        )
        return res.status(400).send({
          message: 'Invalid project ID in job ID'
        })
      }

      const projectDb = await getProjectDbClient({ projectId })

      const observeMetrics = observeMetricsFactory({
        summary: previewJobsProcessedSummary
      })
      const consumePreviewResult = consumePreviewResultFactory({
        logger,
        storePreview: storePreviewFactory({ db: projectDb }),
        updateObjectPreview: updateObjectPreviewFactory({ db: projectDb }),
        getObjectCommitsWithStreamIds: getObjectCommitsWithStreamIdsFactory({
          db: projectDb
        })
      })

      try {
        observeMetrics({ payload: jobResult })

        await consumePreviewResult({
          projectId,
          objectId,
          previewResult: jobResult
        })
      } catch (e) {
        const err = ensureError(e, 'Unknown error when consuming preview result')

        switch (err.name) {
          case StreamNotFoundError.name:
            logger.warn(
              { err },
              'Failed to consume preview result; the stream does not exist. Probably deleted while the preview was being generated.'
            )
            break
          default:
            logger.error({ err }, 'Failed to consume preview result')
        }

        // in either case, we shall acknowledge to the worker that we have received the job result
      }

      res.status(200).send({
        message: 'Job result processed successfully'
      })
      return
    }
  )
  return app
}
