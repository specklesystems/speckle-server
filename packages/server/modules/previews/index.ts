/* istanbul ignore file */
'use strict'
import { validateScopes, authorizeResolver } from '@/modules/shared'
import {
  getCommitsByStreamId,
  getCommitsByBranchName
} from '@/modules/core/services/commits'

import { makeOgImage } from '@/modules/previews/ogImage'
import { moduleLogger } from '@/logging/logging'
import { listenForPreviewGenerationUpdatesFactory } from '@/modules/previews/services/resultListener'

import cors from 'cors'
import { db } from '@/db/knex'
import {
  getObjectPreviewBufferOrFilepathFactory,
  sendObjectPreviewFactory,
  checkStreamPermissionsFactory
} from '@/modules/previews/services/management'
import { getObject } from '@/modules/core/services/objects'
import { getStream } from '@/modules/core/repositories/streams'
import {
  getObjectPreviewInfoFactory,
  createObjectPreviewFactory,
  getPreviewImageFactory
} from '@/modules/previews/repository/previews'
import { publish } from '@/modules/shared/utils/subscriptions'
import {
  getObjectCommitsWithStreamIds,
  getCommitFactory
} from '@/modules/core/repositories/commits'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

const httpErrorImage = (httpErrorCode: number) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

export const init: SpeckleModule['init'] = ({ app, isInitial }) => {
  if (process.env.DISABLE_PREVIEWS) {
    moduleLogger.warn('📸 Object preview module is DISABLED')
  } else {
    moduleLogger.info('📸 Init object preview module')
  }

  const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
    getObject,
    getObjectPreviewInfo: getObjectPreviewInfoFactory({ db }),
    createObjectPreview: createObjectPreviewFactory({ db }),
    getPreviewImage: getPreviewImageFactory({ db })
  })
  const sendObjectPreview = sendObjectPreviewFactory({
    getStream,
    getObjectPreviewBufferOrFilepath,
    makeOgImage
  })
  const checkStreamPermissions = checkStreamPermissionsFactory({
    validateScopes,
    authorizeResolver
  })

  app.options('/preview/:streamId/:angle?', cors())
  app.get('/preview/:streamId/:angle?', cors(), async (req, res) => {
    const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile(httpErrorImage(httpErrorCode))
    }

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
      const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
      if (!hasPermissions) {
        // return res.status( httpErrorCode ).end()
        return res.sendFile(httpErrorImage(httpErrorCode))
      }

      let commitsObj
      try {
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
    const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      // return res.status( httpErrorCode ).end()
      return res.sendFile(httpErrorImage(httpErrorCode))
    }

    const getCommit = getCommitFactory({ db })
    const commit = await getCommit(req.params.commitId, {
      streamId: req.params.streamId
    })
    if (!commit) return res.sendFile(noPreviewImage)

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
    const { hasPermissions } = await checkStreamPermissions(req)
    if (!hasPermissions) {
      return res.status(403).end()
    }

    return sendObjectPreview(
      req,
      res,
      req.params.streamId,
      req.params.objectId,
      req.params.angle
    )
  })

  if (isInitial) {
    const listenForPreviewGenerationUpdates = listenForPreviewGenerationUpdatesFactory({
      getObjectCommitsWithStreamIds,
      publish
    })
    listenForPreviewGenerationUpdates()
  }
}

export const finalize = () => {}
