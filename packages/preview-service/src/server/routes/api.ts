import { getObjectsStreamFactory } from '@/repositories/objects.js'
import { isSimpleTextRequested, simpleTextOrJsonContentType } from '@/utils/headers.js'
import { SpeckleObjectsStream } from '@/utils/speckleObjectsStream.js'
import express from 'express'
import type { Knex } from 'knex'
import { PassThrough, pipeline } from 'stream'
import zlib from 'zlib'

const apiRouterFactory = (deps: { db: Knex }) => {
  const { db } = deps
  const apiRouter = express.Router()

  // This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
  apiRouter.post('/getobjects/:streamId', (req, res) => {
    const boundLogger = req.log.child({
      streamId: req.params.streamId
    })
    //TODO use zod to validate the input
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const childrenList = JSON.parse(req.body.objects) as string[]

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleTextOrJsonContentType(req)
    })

    const dbStream = getObjectsStreamFactory({ db })({
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
