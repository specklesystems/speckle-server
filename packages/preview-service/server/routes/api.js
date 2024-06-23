'use strict'

const zlib = require('zlib')
const express = require('express')
const { getObjectsStream } = require('../repositories/objects')
const { SpeckleObjectsStream } = require('../services/speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')

const router = express.Router()

const isSimpleTextRequested = (req) => req.headers.accept === 'text/plain'

// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.post('/getobjects/:streamId', async (req, res) => {
  const boundLogger = req.log.child({
    streamId: req.params.streamId
  })
  const childrenList = JSON.parse(req.body.objects)

  res.writeHead(200, {
    'Content-Encoding': 'gzip',
    'Content-Type': isSimpleTextRequested(req) ? 'text/plain' : 'application/json'
  })

  const dbStream = await getObjectsStream({
    streamId: req.params.streamId,
    objectIds: childrenList
  })
  const speckleObjStream = new SpeckleObjectsStream(isSimpleTextRequested(req))
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
          {
            numberOfStreamedObjects: childrenList.length,
            sizeOfStreamedObjectsMB: gzipStream.bytesWritten / 1000000
          },
          'Streamed {numberOfStreamedObjects} objects (size: {sizeOfStreamedObjectsMB} MB)'
        )
      }
    }
  )
})

module.exports = router
