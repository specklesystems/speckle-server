'use strict'
const zlib = require('zlib')
const debug = require('debug')
const cors = require('cors')

const { contextMiddleware } = require('@/modules/shared')
const { validatePermissionsReadStream } = require('./authUtils')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { getObjectsStream } = require('../services/objects')

const { pipeline, PassThrough } = require('stream')

module.exports = (app) => {
  app.options('/api/getobjects/:streamId', cors())

  app.post('/api/getobjects/:streamId', cors(), contextMiddleware, async (req, res) => {
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const childrenList = JSON.parse(req.body.objects)
    const simpleText = req.headers.accept === 'text/plain'

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    // "output" stream, connected to res with `pipeline` (auto-closing res)
    const speckleObjStream = new SpeckleObjectsStream(simpleText)
    const gzipStream = zlib.createGzip()

    pipeline(
      speckleObjStream,
      gzipStream,
      new PassThrough({ highWaterMark: 16384 * 31 }),
      res,
      (err) => {
        if (err) {
          debug('speckle:error')(
            `[User ${
              req.context.userId || '-'
            }] App error streaming objects from stream ${req.params.streamId}: ${err}`
          )
        } else {
          debug('speckle:info')(
            `[User ${req.context.userId || '-'}] Streamed ${
              childrenList.length
            } objects from stream ${req.params.streamId} (size: ${
              gzipStream.bytesWritten / 1000000
            } MB)`
          )
        }
      }
    )

    const cSize = 1000
    try {
      for (let cStart = 0; cStart < childrenList.length; cStart += cSize) {
        const childrenChunk = childrenList.slice(cStart, cStart + cSize)

        const dbStream = await getObjectsStream({
          streamId: req.params.streamId,
          objectIds: childrenChunk
        })
        await new Promise((resolve, reject) => {
          dbStream.pipe(speckleObjStream, { end: false })
          dbStream.once('end', resolve)
          dbStream.once('error', reject)
        })
      }
    } catch (ex) {
      debug('speckle:error')(
        `[User ${req.context.userId || '-'}] DB Error streaming objects from stream ${
          req.params.streamId
        }: ${ex}`
      )
      speckleObjStream.emit('error', new Error('Database streaming error'))
    }
    speckleObjStream.end()
  })
}
