'use strict'

const zlib = require('zlib')
const express = require('express')
const { getObject, getObjectChildrenStream } = require('./services/objects_utils')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')
const { logger } = require('../observability/logging')

const router = express.Router()

// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
router.get('/:streamId/:objectId', async function (req, res) {
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
    'Content-Type': simpleText ? 'text/plain' : 'application/json'
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
        logger.error(
          err,
          `Error downloading object ${req.params.objectId} from stream ${req.params.streamId}`
        )
      } else {
        logger.info(
          `Downloaded object ${req.params.objectId} from stream ${
            req.params.streamId
          } (size: ${gzipStream.bytesWritten / 1000000} MB)`
        )
      }
    }
  )
})

router.get('/:streamId/:objectId/single', async (req, res) => {
  const obj = await getObject({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })

  if (!obj) {
    return res.status(404).send('Failed to find object.')
  }

  logger.info(
    `Downloaded single object ${req.params.objectId} from stream ${req.params.streamId}`
  )

  res.send(obj.data)
})

module.exports = router
