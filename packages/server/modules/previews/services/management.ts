import type { GetFormattedObject } from '@/modules/core/domain/objects/operations'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type {
  CheckStreamPermissions,
  CreateObjectPreview,
  GetObjectPreviewBufferOrFilepath,
  GetObjectPreviewInfo,
  GetPreviewImage,
  SendObjectPreview
} from '@/modules/previews/domain/operations'
import { makeOgImage } from '@/modules/previews/ogImage'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { disablePreviews } from '@/modules/shared/helpers/envHelper'
import { Roles, Scopes } from '@speckle/shared'
import type { Logger } from 'pino'
// import { createRequire } from 'node:module'

// const require = createRequire(import.meta.url)
// const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')
// const previewErrorImage = require.resolve('#/assets/previews/images/preview_error.png')
const defaultAngle = '0'

export const getObjectPreviewBufferOrFilepathFactory =
  (deps: {
    getObject: GetFormattedObject
    getObjectPreviewInfo: GetObjectPreviewInfo
    createObjectPreview: CreateObjectPreview
    getPreviewImage: GetPreviewImage
    logger: Logger
  }): GetObjectPreviewBufferOrFilepath =>
  async ({ streamId, objectId, angle }) => {
    const [noPreviewImage, previewErrorImage] = await Promise.all([
      import.meta.resolve!('#/assets/previews/images/no_preview.png'),
      import.meta.resolve!('#/assets/previews/images/preview_error.png')
    ])

    angle = angle || defaultAngle
    const boundLogger = deps.logger.child({ streamId, objectId, angle })

    if (disablePreviews()) {
      return {
        type: 'file',
        file: noPreviewImage
      }
    }

    // Check if objectId is valid
    const dbObj = await deps.getObject({ streamId, objectId })
    if (!dbObj) {
      return {
        type: 'file',
        file: require.resolve('#/assets/previews/images/preview_404.png'),
        error: true,
        errorCode: 'OBJECT_NOT_FOUND'
      }
    }

    // Get existing preview metadata
    const previewInfo = await deps.getObjectPreviewInfo({ streamId, objectId })
    if (!previewInfo) {
      await deps.createObjectPreview({ streamId, objectId, priority: 0 })
    }

    if (!previewInfo || previewInfo.previewStatus !== 2 || !previewInfo.preview) {
      return { type: 'file', file: noPreviewImage }
    }

    const previewImgId = previewInfo.preview[angle]
    if (!previewImgId) {
      boundLogger.warn(
        "Preview angle '{angle}' not found for object {streamId}:{objectId}"
      )
      return {
        type: 'file',
        error: true,
        errorCode: 'ANGLE_NOT_FOUND',
        file: previewErrorImage
      }
    }
    const previewImg = await deps.getPreviewImage({ previewId: previewImgId })
    if (!previewImg) {
      boundLogger.warn(
        { previewImageId: previewImgId },
        'Preview image not found: {previewImageId}'
      )
      return {
        type: 'file',
        file: previewErrorImage,
        error: true,
        errorCode: 'PREVIEW_NOT_FOUND'
      }
    }
    return { type: 'buffer', buffer: previewImg }
  }

export const sendObjectPreviewFactory =
  (deps: {
    getObjectPreviewBufferOrFilepath: GetObjectPreviewBufferOrFilepath
    getStream: GetStream
    makeOgImage: typeof makeOgImage
  }): SendObjectPreview =>
  async (req, res, streamId, objectId, angle) => {
    let previewBufferOrFile = await deps.getObjectPreviewBufferOrFilepath({
      streamId,
      objectId,
      angle
    })

    if (req.query.postprocess === 'og') {
      const stream = await deps.getStream({ streamId: req.params.streamId })
      const streamName = stream!.name

      if (previewBufferOrFile.type === 'file') {
        previewBufferOrFile = {
          type: 'buffer',
          buffer: await deps.makeOgImage(previewBufferOrFile.file, streamName)
        }
      } else {
        previewBufferOrFile = {
          type: 'buffer',
          buffer: await deps.makeOgImage(previewBufferOrFile.buffer, streamName)
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

export const checkStreamPermissionsFactory =
  (deps: {
    validateScopes: typeof validateScopes
    authorizeResolver: typeof authorizeResolver
    getStream: GetStream
  }): CheckStreamPermissions =>
  async (req) => {
    const stream = await deps.getStream({
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
        await deps.validateScopes(req.context.scopes, Scopes.Streams.Read)
      } catch {
        return { hasPermissions: false, httpErrorCode: 401 }
      }

      try {
        await deps.authorizeResolver(
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
