'use strict'
const zlib = require('zlib')
const cors = require('cors')
const debug = require('debug')

const { contextMiddleware } = require('@/modules/shared')
const { validatePermissionsWriteStream } = require('./authUtils')

const { hasObjects } = require('../services/objects')

module.exports = (app) => {
  app.options('/api/diff/:streamId', cors())

  app.post('/api/diff/:streamId', cors(), contextMiddleware, async (req, res) => {
    const hasStreamAccess = await validatePermissionsWriteStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const objectList = JSON.parse(req.body.objects)

    debug('speckle:info')(
      `[User ${req.context.userId || '-'}] Diffing ${
        objectList.length
      } objects for stream ${req.params.streamId}`
    )

    const response = await hasObjects({
      streamId: req.params.streamId,
      objectIds: objectList
    })
    // console.log(response)
    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/json'
    })
    const gzip = zlib.createGzip()
    gzip.write(JSON.stringify(response))
    gzip.flush()
    gzip.end()
    gzip.pipe(res)
  })
}
