'use strict'

import zlib from 'zlib'
import express from 'express'
import {
  getObjectFactory,
  getObjectChildrenStreamFactory
} from '../../repositories/objects'
import { SpeckleObjectsStream } from '../../utils/speckleObjectsStream'
import { pipeline, PassThrough } from 'stream'
import db from '../../repositories/knex'

const objectsRouter = express.Router()
export default objectsRouter

// This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
objectsRouter.get('/:streamId/:objectId', async function (req, res) {
  const boundLogger = req.log.child({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })
  // Populate first object (the "commit")
  const obj = await getObjectFactory({ db })({
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

  const dbStream = await getObjectChildrenStreamFactory({ db })({
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

objectsRouter.get('/:streamId/:objectId/single', async (req, res) => {
  const boundLogger = req.log.child({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })
  const obj = await getObjectFactory({ db })({
    streamId: req.params.streamId,
    objectId: req.params.objectId
  })

  if (!obj) {
    return res.status(404).send('Failed to find object.')
  }

  boundLogger.info('Downloaded single object.')

  res.send(obj.data)
})
