'use strict'

const zlib = require('zlib')
var express = require('express')
var { getObjectsStream } = require('./services/objects_utils')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')

var router = express.Router()

// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.post('/getobjects/:streamId', async (req, res) => {
  let childrenList = JSON.parse(req.body.objects)

  let simpleText = req.headers.accept === 'text/plain'

  res.writeHead(200, {
    'Content-Encoding': 'gzip',
    'Content-Type': simpleText ? 'text/plain' : 'application/json'
  })

  let dbStream = await getObjectsStream({ streamId: req.params.streamId, objectIds: childrenList })
  let speckleObjStream = new SpeckleObjectsStream(simpleText)
  let gzipStream = zlib.createGzip()

  pipeline(
    dbStream,
    speckleObjStream,
    gzipStream,
    new PassThrough({ highWaterMark: 16384 * 31 }),
    res,
    (err) => {
      if (err) {
        console.log(`Error streaming objects from stream ${req.params.streamId}: ${err}`)
      } else {
        console.log(
          `Streamed ${childrenList.length} objects from stream ${req.params.streamId} (size: ${
            gzipStream.bytesWritten / 1000000
          } MB)`
        )
      }
    }
  )
})

module.exports = router
