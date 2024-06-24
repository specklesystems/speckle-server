import crypto from 'crypto'
import { metricOperationErrors } from '../observability/prometheusMetrics'
import joinImages from 'join-images'
import type { ObjectIdentifier } from '../domain/domain'
import type { NotifyUpdate, UpdatePreviewMetadata } from '../repositories/objectPreview'
import type { InsertPreview } from '../repositories/previews'
import type { GeneratePreview } from '../clients/previewService'

export type GenerateAndStore360Preview = (task: ObjectIdentifier) => Promise<void>
export const generateAndStore360PreviewFactory =
  (deps: {
    generatePreview: GeneratePreview
    updatePreviewMetadata: UpdatePreviewMetadata
    notifyUpdate: NotifyUpdate
    insertPreview: InsertPreview
  }): GenerateAndStore360Preview =>
  async (task: ObjectIdentifier) => {
    try {
      const responseBody = await deps.generatePreview(task)

      const metadata: Record<string, string> = {}
      const allImgsArr: Buffer[] = []
      let i = 0
      for (const angle in responseBody) {
        const imgBuffer = Buffer.from(
          responseBody[angle].replace(/^data:image\/\w+;base64,/, ''),
          'base64'
        )
        const previewId = crypto.createHash('md5').update(imgBuffer).digest('hex')

        // Save first preview image
        if (i++ === 0) {
          await deps.insertPreview({ previewId, imgBuffer })
          metadata[angle] = previewId
        }

        allImgsArr.push(imgBuffer)
      }

      // stitch 360 image
      const fullImg = await joinImages(allImgsArr, {
        direction: 'horizontal',
        offset: 700,
        margin: '0 700 0 700',
        color: { alpha: 0, r: 0, g: 0, b: 0 }
      })
      const png = await fullImg.png({ quality: 95 })
      const buff = await png.toBuffer()
      const fullImgId = crypto.createHash('md5').update(buff).digest('hex')

      await deps.insertPreview({ previewId: fullImgId, imgBuffer: buff })
      metadata['all'] = fullImgId

      //FIXME it should be the task manager's responsibility to handle preview metadata
      await deps.updatePreviewMetadata({
        metadata,
        streamId: task.streamId,
        objectId: task.objectId
      })

      await deps.notifyUpdate({ streamId: task.streamId, objectId: task.objectId })
    } catch (err) {
      //FIXME it should be the task manager's responsibility to handle preview metadata
      await deps.updatePreviewMetadata({
        metadata: { err: err instanceof Error ? err.message : JSON.stringify(err) },
        streamId: task.streamId,
        objectId: task.objectId
      })
      metricOperationErrors?.labels('preview').inc()
    }
  }
