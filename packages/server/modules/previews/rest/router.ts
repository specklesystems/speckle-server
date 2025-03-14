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
  storeObjectPreviewFactory
} from '@/modules/previews/repository/previews'
import {
  getCommitFactory,
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
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { requestObjectPreviewFactory } from '@/modules/previews/queues/previews'
import type { Queue } from 'bull'
import type { Knex } from 'knex'

const httpErrorImage = (httpErrorCode: number) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

const buildCreateObjectPreviewFunction = ({
  projectDb,
  previewRequestQueue,
  responseQueueName
}: {
  projectDb: Knex
  previewRequestQueue: Queue
  responseQueueName: string
}) => {
  return createObjectPreviewFactory({
    requestObjectPreview: requestObjectPreviewFactory({
      queue: previewRequestQueue,
      responseQueue: responseQueueName
    }),
    serverOrigin: getServerOrigin(),
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
  responseQueueName
}: {
  previewRequestQueue: Queue
  responseQueueName: string
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
        previewRequestQueue,
        responseQueueName
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
          previewRequestQueue,
          responseQueueName
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
        previewRequestQueue,
        responseQueueName
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
        previewRequestQueue,
        responseQueueName
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
  return app
}
