/* istanbul ignore file */
import { validateScopes, authorizeResolver } from '@/modules/shared'

import { makeOgImage } from '@/modules/previews/ogImage'
import { moduleLogger } from '@/logging/logging'
import { messageProcessor } from '@/modules/previews/resultListener'

import cors from 'cors'
import { db } from '@/db/knex'
import {
  getObjectPreviewBufferOrFilepathFactory,
  sendObjectPreviewFactory,
  checkStreamPermissionsFactory
} from '@/modules/previews/services/management'
import {
  getObjectPreviewInfoFactory,
  createObjectPreviewFactory,
  getPreviewImageFactory
} from '@/modules/previews/repository/previews'
import {
  getCommitFactory,
  getPaginatedBranchCommitsItemsFactory,
  legacyGetPaginatedStreamCommitsPageFactory
} from '@/modules/core/repositories/commits'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getPaginatedBranchCommitsItemsByNameFactory } from '@/modules/core/services/commit/retrieval'
import { getStreamBranchByNameFactory } from '@/modules/core/repositories/branches'
import { getFormattedObjectFactory } from '@/modules/core/repositories/objects'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { listenFor } from '@/modules/core/utils/dbNotificationListener'

const httpErrorImage = (httpErrorCode: number) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

export const init: SpeckleModule['init'] = (app, isInitial) => {
  if (process.env.DISABLE_PREVIEWS) {
    moduleLogger.warn('📸 Object preview module is DISABLED')
  } else {
    moduleLogger.info('📸 Init object preview module')
  }

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
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: createObjectPreviewFactory({ db: projectDb }),
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
        getObject: getFormattedObjectFactory({ db: projectDb }),
        getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
        createObjectPreview: createObjectPreviewFactory({ db: projectDb }),
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
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: createObjectPreviewFactory({ db: projectDb }),
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
      getObject: getFormattedObjectFactory({ db: projectDb }),
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db: projectDb }),
      createObjectPreview: createObjectPreviewFactory({ db: projectDb }),
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

  if (isInitial) {
    listenFor('preview_generation_update', messageProcessor)
  }
}

export const finalize = () => {}
