/* istanbul ignore file */
'use strict'
const { validateScopes, authorizeResolver } = require('@/modules/shared')
const { getStream } = require('../core/services/streams')
const {
  getCommitsByStreamId,
  getCommitsByBranchName,
  getCommitById
} = require('../core/services/commits')

const { makeOgImage } = require('./ogImage')
const { moduleLogger } = require('@/logging/logging')
const {
  listenForPreviewGenerationUpdates
} = require('@/modules/previews/services/resultListener')
const { Scopes, Roles } = require('@speckle/shared')

const httpErrorImage = (httpErrorCode) =>
  require.resolve(`#/assets/previews/images/preview_${httpErrorCode}.png`)

const cors = require('cors')
const { db } = require('@/db/knex')
const {
  getObjectPreviewBufferOrFilepathFactory
} = require('@/modules/previews/services/management')
const { getObject } = require('@/modules/core/services/objects')
const {
  getObjectPreviewInfoFactory,
  createObjectPreviewFactory,
  getPreviewImageFactory
} = require('@/modules/previews/repository/previews')

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')

exports.init = (app, isInitial) => {
  if (process.env.DISABLE_PREVIEWS) {
    moduleLogger.warn('📸 Object preview module is DISABLED')
  } else {
    moduleLogger.info('📸 Init object preview module')
  }

  const DEFAULT_ANGLE = '0'

  const sendObjectPreview = async (req, res, streamId, objectId, angle) => {
    const getObjectPreviewBufferOrFilepath = getObjectPreviewBufferOrFilepathFactory({
      getObject,
      getObjectPreviewInfo: getObjectPreviewInfoFactory({ db }),
      createObjectPreview: createObjectPreviewFactory({ db }),
      getPreviewImage: getPreviewImageFactory({ db })
    })
    let previewBufferOrFile = await getObjectPreviewBufferOrFilepath({
      streamId,
      objectId,
      angle
    })

    if (req.query.postprocess === 'og') {
      const stream = await getStream({ streamId: req.params.streamId })
      const streamName = stream.name

      if (previewBufferOrFile.type === 'file') {
        previewBufferOrFile = {
          type: 'buffer',
          buffer: await makeOgImage(previewBufferOrFile.file, streamName)
        }
      } else {
        previewBufferOrFile = {
          type: 'buffer',
          buffer: await makeOgImage(previewBufferOrFile.buffer, streamName)
        }
      }
    }
    if (previewBufferOrFile.error) {
      res.set('X-Preview-Error', 'true')
    }
    if (previewBufferOrFile.errorCode) {
      res.set('X-Preview-Error-Code', previewBufferOrFile.errorCode)
    }
    if (previewBufferOrFile.type === 'file') {
      // we can't cache these cause they may switch to proper buffer previews in a sec
      // at least if they're not in the error state which they will not get out of (and thus can be cached in that scenario)
      if (previewBufferOrFile.error) {
        res.set('Cache-Control', 'private, max-age=604800')
      } else {
        res.set('Cache-Control', 'no-cache, no-store')
      }
      res.sendFile(previewBufferOrFile.file)
    } else {
      res.contentType('image/png')
      // If the preview is a buffer, it comes from the DB and can be cached on clients
      res.set('Cache-Control', 'private, max-age=604800')
      res.send(previewBufferOrFile.buffer)
    }
  }

  const checkStreamPermissions = async (req) => {
    const stream = await getStream({
      streamId: req.params.streamId,
      userId: req.context.userId
    })

    if (!stream) {
      return { hasPermissions: false, httpErrorCode: 404 }
    }

    if (!stream.isPublic && req.context.auth === false) {
      return { hasPermissions: false, httpErrorCode: 401 }
    }

    if (!stream.isPublic) {
      try {
        await validateScopes(req.context.scopes, Scopes.Streams.Read)
      } catch {
        return { hasPermissions: false, httpErrorCode: 401 }
      }

      try {
        await authorizeResolver(
          req.context.userId,
          req.params.streamId,
          Roles.Stream.Reviewer,
          req.context.resourceAccessRules
        )
      } catch {
        return { hasPermissions: false, httpErrorCode: 401 }
      }
    }
    return { hasPermissions: true, httpErrorCode: 200 }
  }

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
      req.params.angle || DEFAULT_ANGLE
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
        req.params.angle || DEFAULT_ANGLE
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
      req.params.angle || DEFAULT_ANGLE
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
      req.params.angle || DEFAULT_ANGLE
    )
  })

  if (isInitial) {
    listenForPreviewGenerationUpdates()
  }
}

exports.finalize = () => {}
