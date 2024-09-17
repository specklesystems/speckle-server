import { logger } from '@/logging/logging'
import { getObject } from '@/modules/core/services/objects'
import {
  CreateObjectPreview,
  GetObjectPreviewBufferOrFilepath,
  GetObjectPreviewInfo,
  GetPreviewImage
} from '@/modules/previews/domain/operations'

const noPreviewImage = require.resolve('#/assets/previews/images/no_preview.png')
const previewErrorImage = require.resolve('#/assets/previews/images/preview_error.png')

export const getObjectPreviewBufferOrFilepathFactory =
  (deps: {
    getObject: typeof getObject
    getObjectPreviewInfo: GetObjectPreviewInfo
    createObjectPreview: CreateObjectPreview
    getPreviewImage: GetPreviewImage
  }): GetObjectPreviewBufferOrFilepath =>
  async ({ streamId, objectId, angle }) => {
    if (process.env.DISABLE_PREVIEWS) {
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
      logger.warn(
        `Preview angle '${angle}' not found for object ${streamId}:${objectId}`
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
      logger.warn(`Preview image not found: ${previewImgId}`)
      return {
        type: 'file',
        file: previewErrorImage,
        error: true,
        errorCode: 'PREVIEW_NOT_FOUND'
      }
    }
    return { type: 'buffer', buffer: previewImg }
  }
