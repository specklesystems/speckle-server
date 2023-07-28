'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')

const { validatePermissionsWriteStream } = require('./authUtils')

const { hasObjects } = require('../services/objects')

const MAXIMUM_OBJECTS = 65536

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
    if (objectList.length > MAXIMUM_OBJECTS) {
      req.log.warn(
        `User ${req.context.userId} tried to diff ${objectList.length} objects, which is greater than the maximum of ${MAXIMUM_OBJECTS}.`
      )
      return res.status(400).end(`Too many objects. Maximum ${MAXIMUM_OBJECTS}.`)
    }

    req.log.info(`Diffing ${objectList.length} objects.`)

    const response = await hasObjects({
      streamId: req.params.streamId,
      objectIds: objectList
    })
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
