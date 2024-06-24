import crypto from 'crypto'
import { metricOperationErrors } from '../observability/prometheusMetrics'
import joinImages from 'join-images'
import { updatePreviewMetadata, notifyUpdate } from '../repositories/objectPreview'
import { serviceUrl } from '../utils/env'
import { insertPreview } from '../repositories/previews'
import { ObjectIdentifier } from 'domain/domain'

export async function generateAndStore360Preview(task: ObjectIdentifier) {
  const previewUrl = `${serviceUrl()}/preview/${task.streamId}/${task.objectId}`

  try {
    const response = await fetch(previewUrl)
    const responseBody: Record<string, string> = await response.json()
    // let imgBuffer = await res.buffer()  // this gets the binary response body

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
        await insertPreview({ previewId, imgBuffer })
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

    await insertPreview({ previewId: fullImgId, imgBuffer: buff })
    metadata['all'] = fullImgId

    //FIXME it should be the task manager's responsibility to handle preview metadata
    await updatePreviewMetadata({
      metadata,
      streamId: task.streamId,
      objectId: task.objectId
    })

    await notifyUpdate({ streamId: task.streamId, objectId: task.objectId })
  } catch (err) {
    //FIXME it should be the task manager's responsibility to handle preview metadata
    await updatePreviewMetadata({
      metadata: { err: err instanceof Error ? err.message : JSON.stringify(err) },
      streamId: task.streamId,
      objectId: task.objectId
    })
    metricOperationErrors?.labels('preview').inc()
  }
}
