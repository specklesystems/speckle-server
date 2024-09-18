/* istanbul ignore file */
'use strict'
const { validateScopes, authorizeResolver } = require('@/modules/shared')
const {
  getCommitsByStreamId,
  getCommitsByBranchName,
  getCommitById
} = require('../core/services/commits')

const { makeOgImage } = require('./ogImage')
const { moduleLogger } = require('@/logging/logging')
const {
  listenForPreviewGenerationUpdatesFactory
} = require('@/modules/previews/services/resultListener')

const httpErrorImage = (httpErrorCode) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const cors = require('cors')
const { db } = require('@/db/knex')
const {
  getObjectPreviewBufferOrFilepathFactory,
  sendObjectPreviewFactory,
  checkStreamPermissionsFactory
} = require('@/modules/previews/services/management')
const { getObject } = require('@/modules/core/services/objects')
const {
  getObjectPreviewInfoFactory,
  createObjectPreviewFactory,
  getPreviewImageFactory
} = require('@/modules/previews/repository/previews')
const { publish } = require('@/modules/shared/utils/subscriptions')
const { getObjectCommitsWithStreamIds } = require('@/modules/core/repositories/commits')

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

exports.init = (app, isInitial) => {
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
    getObject,
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
      ignoreGlobalsBranch: true
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
          limit: 1
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

    const commit = await getCommitById({
      streamId: req.params.streamId,
      id: req.params.commitId
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

exports.finalize = () => {}
