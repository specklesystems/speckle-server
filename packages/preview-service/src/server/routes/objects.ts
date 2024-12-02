import { getProjectDbClient } from '@/clients/knex.js'
import {
  getObjectChildrenStreamFactory,
  getObjectFactory
} from '@/repositories/objects.js'
import { isSimpleTextRequested, simpleTextOrJsonContentType } from '@/utils/headers.js'
import { SpeckleObjectsStream } from '@/utils/speckleObjectsStream.js'
import express, { RequestHandler } from 'express'
import { PassThrough, pipeline } from 'stream'
import zlib from 'zlib'

const objectsRouterFactory = () => {
  const objectsRouter = express.Router()

  // This method was copy-pasted from the server method, without authentication/authorization (this web service is an internal one)
  objectsRouter.get(
    '/:streamId/:objectId',
    async function (req, res) {
      const boundLogger = req.log.child({
        streamId: req.params.streamId,
        objectId: req.params.objectId
      })

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      // Populate first object (the "commit")
      const obj = await getObjectFactory({ db: projectDb })({
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

      const dbStream = await getObjectChildrenStreamFactory({ db: projectDb })({
        streamId: req.params.streamId,
        objectId: req.params.objectId
      })
      // https://knexjs.org/faq/recipes.html#manually-closing-streams
      // https://github.com/knex/knex/issues/2324
      req.on('close', () => {
        dbStream.end.bind(dbStream)
        dbStream.destroy.bind(dbStream)
      })

      const speckleObjStream = new SpeckleObjectsStream(isSimpleTextRequested(req))
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

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const obj = await getObjectFactory({ db: projectDb })({
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
