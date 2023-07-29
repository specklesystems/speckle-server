'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')

const { validatePermissionsWriteStream } = require('./authUtils')

const { hasObjects } = require('../services/objects')

const { chunk } = require('lodash')

module.exports = (app) => {
  app.options('/api/diff/:streamId', corsMiddleware())

  app.post('/api/diff/:streamId', corsMiddleware(), async (req, res) => {
    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })
    const hasStreamAccess = await validatePermissionsWriteStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const objectList = JSON.parse(req.body.objects)

    req.log.info(`Diffing ${objectList.length} objects.`)

    const chunkSize = 1000
    const objectListChunks = chunk(objectList, chunkSize)
    const mappedObjects = await Promise.all(
      objectListChunks.map((objectListChunk) =>
        hasObjects({
          streamId: req.params.streamId,
          objectIds: objectListChunk
        })
      )
    )
    const response = {}
    Object.assign(response, ...mappedObjects)

    req.log.debug(response)
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
