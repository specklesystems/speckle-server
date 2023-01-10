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
  const boundLogger = logger.child({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })
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
        boundLogger.error(err, 'Error downloading object from stream')
      } else {
        boundLogger.info(
          `Downloaded object from stream (size: ${
            gzipStream.bytesWritten / 1000000
          } MB)`
        )
      }
    }
  )
})

router.get('/:streamId/:objectId/single', async (req, res) => {
  const boundLogger = logger.child({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })
  const obj = await getObject({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })

  if (!obj) {
    return res.status(404).send('Failed to find object.')
  }

  boundLogger.info('Downloaded single object.')

  res.send(obj.data)
})

module.exports = router
