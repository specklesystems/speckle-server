'use strict'
const zlib = require('zlib')
const debug = require('debug')
const cors = require('cors')

const { contextMiddleware } = require('@/modules/shared')
const { validatePermissionsReadStream } = require('./authUtils')

const { getObject, getObjectChildrenStream } = require('../services/objects')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')

module.exports = (app) => {
  app.options('/objects/:streamId/:objectId', cors())

  app.get(
    '/objects/:streamId/:objectId',
    cors(),
    contextMiddleware,
    async (req, res) => {
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
            debug('speckle:error')(
              `[User ${req.context.userId || '-'}] Error downloading object ${
                req.params.objectId
              } from stream ${req.params.streamId}: ${err}`
            )
          } else {
            debug('speckle:info')(
              `[User ${req.context.userId || '-'}] Downloaded object ${
                req.params.objectId
              } from stream ${req.params.streamId} (size: ${
                gzipStream.bytesWritten / 1000000
              } MB)`
            )
          }
        }
      )
    }
  )

  app.options('/objects/:streamId/:objectId/single', cors())
  app.get(
    '/objects/:streamId/:objectId/single',
    cors(),
    contextMiddleware,
    async (req, res) => {
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
        return res.status(404).send('Failed to find object.')
      }

      debug('speckle:info')(
        `[User ${req.context.userId || '-'}] Downloaded single object ${
          req.params.objectId
        } from stream ${req.params.streamId}`
      )

      res.send(obj.data)
    }
  )
}
