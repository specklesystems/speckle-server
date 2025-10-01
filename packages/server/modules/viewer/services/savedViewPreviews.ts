import {
  SavedViewPreviewType,
  type DownscaleScreenshotForThumbnail,
  type GetSavedView,
  type OutputSavedViewPreview
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewPreviewRetrievalError } from '@/modules/viewer/errors/savedViews'
import sharp from 'sharp'

const THUMBNAIL_WIDTH = 420
const THUMBNAIL_HEIGHT = 240

const screenshotToBuffer = (screenshot: string) => {
  // no `data:image/png;base64,` prefix
  const preview = screenshot.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(preview, 'base64')
}

export const outputSavedViewPreviewFactory =
  (deps: { getSavedView: GetSavedView }): OutputSavedViewPreview =>
  async (params) => {
    const { res, projectId, viewId, type } = params
    const view = await deps.getSavedView({ projectId, id: viewId })
    if (!view) {
      throw new SavedViewPreviewRetrievalError('Could not find view', {
        info: { projectId, viewId }
      })
    }

    // both should be set, but early on in development we only had the one
    const image =
      (type === SavedViewPreviewType.preview ? view.screenshot : view.thumbnail) ||
      view.screenshot
    const imgBuffer = screenshotToBuffer(image)
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'no-cache, no-store'
    })

    res.end(imgBuffer)
  }

export const downscaleScreenshotForThumbnailFactory =
  (): DownscaleScreenshotForThumbnail => async (params: { screenshot: string }) => {
    const { screenshot } = params
    const imgBuffer = screenshotToBuffer(screenshot)

    // Use sharp to get metadata
    const image = sharp(imgBuffer)
    const meta = await image.metadata()
    const { width: srcW, height: srcH } = meta

    // If source is already smaller or equal in both dimensions, do nothing
    if (srcW <= THUMBNAIL_WIDTH && srcH <= THUMBNAIL_HEIGHT) {
      return screenshot
    }

    // Otherwise, resize (downscale). Use withoutEnlargement to guard.
    const outBuf = await image
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'inside', // ensures we maintain aspect ratio and fit *within* box
        withoutEnlargement: true
      })
      // Optionally, set output format / quality depending on mimeType
      .toFormat(meta.format || 'png', { quality: 100 })
      .toBuffer()

    // Convert back to base64 with prefix
    const outB64 = outBuf.toString('base64')
    const prefix = `data:image/png;base64,`
    return `${prefix}${outB64}`
  }
