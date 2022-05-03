/* istanbul ignore file */
'use strict'

const debug = require('debug')

const {
  contextMiddleware,
  validateScopes,
  authorizeResolver
} = require('@/modules/shared')

const { getStream } = require('../core/services/streams')
const { getObject } = require('../core/services/objects')
const {
  getCommitsByStreamId,
  getCommitsByBranchName,
  getCommitById
} = require('../core/services/commits')
const {
  getPreviewImage,
  createObjectPreview,
  getObjectPreviewInfo
} = require('./services/previews')

const { makeOgImage } = require('./ogImage')

const httpErrorImage = (httpErrorCode) =>
  require.resolve(`@/modules/previews/assets/preview_${httpErrorCode}.png`)

const noPreviewImage = require.resolve('@/modules/previews/assets/no_preview.png')
const previewErrorImage = require.resolve('@/modules/previews/assets/preview_error.png')

exports.init = (app) => {
  if (process.env.DISABLE_PREVIEWS) {
    debug('speckle:modules')('📸 Object preview module is DISABLED')
  } else {
    debug('speckle:modules')('📸 Init object preview module')
  }

  const DEFAULT_ANGLE = '0'

  const getObjectPreviewBufferOrFilepath = async ({ streamId, objectId, angle }) => {
    if (process.env.DISABLE_PREVIEWS) {
      return {
        type: 'file',
        file: noPreviewImage
      }
    }

    // Check if objectId is valid
    const dbObj = await getObject({ streamId, objectId })
    if (!dbObj) {
      return {
        type: 'file',
        file: require.resolve('@/modules/previews/assets/preview_404.png')
      }
    }

    // Get existing preview metadata
    const previewInfo = await getObjectPreviewInfo({ streamId, objectId })
    if (!previewInfo) {
      await createObjectPreview({ streamId, objectId, priority: 0 })
    }

    if (!previewInfo || previewInfo.previewStatus !== 2 || !previewInfo.preview) {
      return { type: 'file', file: noPreviewImage }
    }

    const previewImgId = previewInfo.preview[angle]
    if (!previewImgId) {
      debug('speckle:errors')(
        `Error: Preview angle '${angle}' not found for object ${streamId}:${objectId}`
      )
      return {
        type: 'file',
        file: previewErrorImage
      }
    }
    const previewImg = await getPreviewImage({ previewId: previewImgId })
    if (!previewImg) {
      debug('speckle:errors')(`Error: Preview image not found: ${previewImgId}`)
      return {
        type: 'file',
        file: previewErrorImage
      }
    }
    return { type: 'buffer', buffer: previewImg }
  }

  const sendObjectPreview = async (req, res, streamId, objectId, angle) => {
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

    if (previewBufferOrFile.type === 'file') {
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
        await validateScopes(req.context.scopes, 'streams:read')
      } catch (err) {
        return { hasPermissions: false, httpErrorCode: 401 }
      }

      try {
        await authorizeResolver(
          req.context.userId,
          req.params.streamId,
          'stream:reviewer'
        )
      } catch (err) {
        return { hasPermissions: false, httpErrorCode: 401 }
      }
    }
    return { hasPermissions: true, httpErrorCode: 200 }
  }

  app.get(
    '/preview/:streamId/objects/:objectId/:angle',
    contextMiddleware,
    async (req, res) => {
      const { hasPermissions, httpErrorCode } = await checkStreamPermissions(req)
      if (!hasPermissions) {
        // return res.status( httpErrorCode ).end()
        return res.sendFile(httpErrorImage(httpErrorCode))
      }

      return sendObjectPreview(
        req,
        res,
        req.params.streamId,
        req.params.objectId,
        req.params.angle
      )
    }
  )

  app.get('/preview/:streamId', contextMiddleware, async (req, res) => {
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
      DEFAULT_ANGLE
    )
  })

  app.get(
    '/preview/:streamId/branches/:branchName',
    contextMiddleware,
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
        DEFAULT_ANGLE
      )
    }
  )

  app.get(
    '/preview/:streamId/commits/:commitId',
    contextMiddleware,
    async (req, res) => {
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
        DEFAULT_ANGLE
      )
    }
  )

  app.get(
    '/preview/:streamId/objects/:objectId',
    contextMiddleware,
    async (req, res) => {
      const { hasPermissions } = await checkStreamPermissions(req)
      if (!hasPermissions) {
        // return res.status( httpErrorCode ).end()
        return res.sendFile()
      }

      return sendObjectPreview(
        req,
        res,
        req.params.streamId,
        req.params.objectId,
        DEFAULT_ANGLE
      )
    }
  )
}

exports.finalize = () => {}
