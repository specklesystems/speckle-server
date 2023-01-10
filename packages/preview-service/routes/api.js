'use strict'

const zlib = require('zlib')
const express = require('express')
const { getObjectsStream } = require('./services/objects_utils')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')
const { logger } = require('../observability/logging')

const router = express.Router()

// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.post('/getobjects/:streamId', async (req, res) => {
  const boundLogger = logger.child({
    streamId: req.params.streamId
  })
  const childrenList = JSON.parse(req.body.objects)

  const simpleText = req.headers.accept === 'text/plain'

  res.writeHead(200, {
    'Content-Encoding': 'gzip',
    'Content-Type': simpleText ? 'text/plain' : 'application/json'
  })

  const dbStream = await getObjectsStream({
    streamId: req.params.streamId,
    objectIds: childrenList
  })
  const speckleObjStream = new SpeckleObjectsStream(simpleText)
  const gzipStream = zlib.createGzip()

  pipeline(
    dbStream,
    speckleObjStream,
    gzipStream,
    new PassThrough({ highWaterMark: 16384 * 31 }),
    res,
    (err) => {
      if (err) {
        boundLogger.error(err, `Error streaming objects.`)
      } else {
        boundLogger.info(
          `Streamed ${childrenList.length} objects (size: ${
            gzipStream.bytesWritten / 1000000
          } MB)`
        )
      }
    }
  )
})

module.exports = router
