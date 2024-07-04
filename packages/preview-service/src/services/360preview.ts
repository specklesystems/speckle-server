import type { GeneratePreview } from '#src/clients/previewService.js'
import type { ObjectIdentifier } from '#src/domain/domain.js'
import type { InsertPreview } from '#src/repositories/previews.js'
import crypto from 'crypto'
import { joinImages } from 'join-images'

export type GenerateAndStore360Preview = (
  task: ObjectIdentifier
) => Promise<{ metadata: Record<string, string> }>
export const generateAndStore360PreviewFactory =
  (deps: {
    generatePreview: GeneratePreview
    insertPreview: InsertPreview
  }): GenerateAndStore360Preview =>
  async (task: ObjectIdentifier) => {
    const responseBody = await deps.generatePreview(task)

    // metadata is key of angle and value of previewId
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
    const png = fullImg.png({ quality: 95 })
    const buff = await png.toBuffer()
    const fullImgId = crypto.createHash('md5').update(buff).digest('hex')

    await deps.insertPreview({ previewId: fullImgId, imgBuffer: buff })
    metadata['all'] = fullImgId

    return { metadata }
  }
