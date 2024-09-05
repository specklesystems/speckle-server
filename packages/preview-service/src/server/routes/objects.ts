import {
  getObjectChildrenStreamFactory,
  getObjectFactory
} from '@/repositories/objects.js'
import { isSimpleTextRequested, simpleTextOrJsonContentType } from '@/utils/headers.js'
import { SpeckleObjectsStream } from '@/utils/speckleObjectsStream.js'
import express, { RequestHandler } from 'express'
import type { Knex } from 'knex'
import { PassThrough, pipeline } from 'stream'
import zlib from 'zlib'

const objectsRouterFactory = (deps: { db: Knex }) => {
  const { db } = deps
  const objectsRouter = express.Router()

  // This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
  objectsRouter.get(
    '/:streamId/:objectId',
    async function (req, res) {
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

      res.writeHead(200, {
        'Content-Encoding': 'gzip',
        'Content-Type': simpleTextOrJsonContentType(req)
      })

      const dbStream = await getObjectChildrenStreamFactory({ db })({
        streamId: req.params.streamId,
        objectId: req.params.objectId
      })

      const speckleObjStream = new SpeckleObjectsStream(isSimpleTextRequested(req))
      const speckleObjStreamCloseHandler = () => {
        // https://knexjs.org/faq/recipes.html#manually-closing-streams
        dbStream.end.bind(dbStream)
      }
      speckleObjStream.once('close', speckleObjStreamCloseHandler)

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
    } as RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )

  objectsRouter.get(
    '/:streamId/:objectId/single',
    (async (req, res) => {
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
    }) as RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )

  return objectsRouter
}

export default objectsRouterFactory
