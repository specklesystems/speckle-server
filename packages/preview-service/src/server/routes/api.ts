import zlib from 'zlib'
import express from 'express'
import { getObjectsStreamFactory } from '@/repositories/objects'
import { SpeckleObjectsStream } from '@/utils/speckleObjectsStream'
import { pipeline, PassThrough } from 'stream'
import type { Knex } from 'knex'

const apiRouterFactory = (deps: { db: Knex }) => {
  const { db } = deps
  const apiRouter = express.Router()

  const isSimpleTextRequested = (req: express.Request) =>
    req.headers.accept === 'text/plain'

  // This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
  apiRouter.post('/getobjects/:streamId', async (req, res) => {
    const boundLogger = req.log.child({
      streamId: req.params.streamId
    })
    const childrenList = JSON.parse(req.body.objects)

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': isSimpleTextRequested(req) ? 'text/plain' : 'application/json'
    })

    const dbStream = await getObjectsStreamFactory({ db })({
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
  return apiRouter
}

export default apiRouterFactory
