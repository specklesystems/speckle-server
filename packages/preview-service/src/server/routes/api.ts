import { getProjectDbClient } from '@/clients/knex.js'
import { getObjectsStreamFactory } from '@/repositories/objects.js'
import { isSimpleTextRequested, simpleTextOrJsonContentType } from '@/utils/headers.js'
import { SpeckleObjectsStream } from '@/utils/speckleObjectsStream.js'
import express from 'express'
import { PassThrough, pipeline } from 'stream'
import zlib from 'zlib'
import { z } from 'zod'

const apiRouterFactory = () => {
  const apiRouter = express.Router()

  const getObjectsRequestBodySchema = z.object({
    objects: z.preprocess((objects) => JSON.parse(String(objects)), z.array(z.string()))
  })

  // This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
  apiRouter.post(
    '/getobjects/:streamId',
    (async (req, res) => {
      const boundLogger = req.log.child({
        streamId: req.params.streamId
      })
      const getObjectsRequestBody = await getObjectsRequestBodySchema.parseAsync(
        req.body
      )

      res.writeHead(200, {
        'Content-Encoding': 'gzip',
        'Content-Type': simpleTextOrJsonContentType(req)
      })

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

      const dbStream = getObjectsStreamFactory({ db: projectDb })({
        streamId: req.params.streamId,
        objectIds: getObjectsRequestBody.objects
      })
      // https://knexjs.org/faq/recipes.html#manually-closing-streams
      // https://github.com/knex/knex/issues/2324
      req.on('close', () => {
        dbStream.end.bind(dbStream)
        dbStream.destroy.bind(dbStream)
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
                numberOfStreamedObjects: getObjectsRequestBody.objects.length,
                sizeOfStreamedObjectsMB: gzipStream.bytesWritten / 1000000
              },
              'Streamed {numberOfStreamedObjects} objects (size: {sizeOfStreamedObjectsMB} MB)'
            )
          }
        }
      )
    }) as express.RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )
  return apiRouter
}

export default apiRouterFactory
