'use strict'

const crypto = require('crypto')
const fetch = require('node-fetch')
const metrics = require('../observability/prometheusMetrics')
const joinImages = require('join-images')
const { updatePreviewMetadata, notifyUpdate } = require('../repositories/objectPreview')
const { serviceUrl } = require('../env')
const { insertPreview } = require('../repositories/previews')

async function generateAndStore360Preview(task) {
  const previewUrl = `${serviceUrl()}/preview/${task.streamId}/${task.objectId}`

  try {
    let res = await fetch(previewUrl)
    res = await res.json()
    // let imgBuffer = await res.buffer()  // this gets the binary response body

    const metadata = {}
    const allImgsArr = []
    let i = 0
    for (const angle in res) {
      const imgBuffer = new Buffer.from(
        res[angle].replace(/^data:image\/\w+;base64,/, ''),
        'base64'
      )
      const previewId = crypto.createHash('md5').update(imgBuffer).digest('hex')

      // Save first preview image
      if (i++ === 0) {
        await insertPreview(previewId, imgBuffer)
        metadata[angle] = previewId
      }

      allImgsArr.push(imgBuffer)
    }

    // stitch 360 image
    const fullImg = await joinImages.joinImages(allImgsArr, {
      direction: 'horizontal',
      offset: 700,
      margin: '0 700 0 700',
      color: { alpha: 0, r: 0, g: 0, b: 0 }
    })
    const png = await fullImg.png({ quality: 95 })
    const buff = await png.toBuffer()
    const fullImgId = crypto.createHash('md5').update(buff).digest('hex')

    await insertPreview(fullImgId, buff)
    metadata['all'] = fullImgId

    //FIXME it should be the task manager's responsibility to handle preview metadata
    await updatePreviewMetadata(metadata, task.streamId, task.objectId)

    await notifyUpdate(task.streamId, task.objectId)
  } catch (err) {
    //FIXME it should be the task manager's responsibility to handle preview metadata
    await updatePreviewMetadata({ err: err.toString() }, task.streamId, task.objectId)
    metrics.metricOperationErrors.labels('preview').inc()
  }
}

module.exports = {
  generateAndStore360Preview
}
