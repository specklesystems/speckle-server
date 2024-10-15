'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')

const { validatePermissionsReadStream } = require('./authUtils')

const { getObject, getObjectChildrenStream } = require('../services/objects')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')
const { logger } = require('@/logging/logging')
module.exports = (app) => {
  app.options('/objects/:streamId/:objectId', corsMiddleware())

  app.get('/objects/:streamId/:objectId', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    // Populate first object (the "commit")
    const obj = await getObject({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })

    if (!obj) {
      return res.status(404).send('Failed to find object.')
    }

    const simpleText = req.headers.accept === 'text/plain'

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    const dbStream = await getObjectChildrenStream({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    // https://knexjs.org/faq/recipes.html#manually-closing-streams
    // https://github.com/knex/knex/issues/2324
    req.on('close', () => {
      dbStream.end.bind(dbStream)
      dbStream.destroy.bind(dbStream)
    })
    const speckleObjStream = new SpeckleObjectsStream(simpleText)
    const gzipStream = zlib.createGzip()

    speckleObjStream.write(obj)

    pipeline(
      dbStream,
      speckleObjStream,
      gzipStream,
      new PassThrough({ highWaterMark: 16384 * 31 }),
      res,
      (err) => {
        if (err) {
          boundLogger.error(err, 'Error downloading object.')
        } else {
          boundLogger.info(
            `Downloaded object (size: ${gzipStream.bytesWritten / 1000000} MB)`
          )
        }
      }
    )
  })

  app.options('/objects/:streamId/:objectId/single', corsMiddleware())
  app.get('/objects/:streamId/:objectId/single', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const obj = await getObject({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })

    if (!obj) {
      boundLogger.warn('Failed to find object.')
      return res.status(404).send('Failed to find object.')
    }

    boundLogger.info('Downloaded single object.')

    res.send(obj.data)
  })
}
