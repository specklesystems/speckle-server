import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'

import { SpeckleObjectsStream } from '@/modules/core/rest/speckleObjectsStream'
import { pipeline, PassThrough } from 'stream'
import { logger } from '@/logging/logging'
import {
  getFormattedObjectFactory,
  getObjectChildrenStreamFactory
} from '@/modules/core/repositories/objects'
import { db } from '@/db/knex'
import { validatePermissionsReadStreamFactory } from '@/modules/core/services/streams/auth'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { validateScopes, authorizeResolver } from '@/modules/shared'
import type express from 'express'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

export default (app: express.Express) => {
  const validatePermissionsReadStream = validatePermissionsReadStreamFactory({
    getStream: getStreamFactory({ db }),
    validateScopes,
    authorizeResolver
  })

  app.options('/objects/:streamId/:objectId', corsMiddleware())

  app.get('/objects/:streamId/:objectId', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }
    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
    const getObject = getFormattedObjectFactory({ db: projectDb })
    const getObjectChildrenStream = getObjectChildrenStreamFactory({ db: projectDb })

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
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    const dbStream = await getObjectChildrenStream({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    // https://knexjs.org/faq/recipes.html#manually-closing-streams
    // https://github.com/knex/knex/issues/2324
    req.on('close', () => {
      dbStream.end.bind(dbStream)
      dbStream.destroy.bind(dbStream)
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
          boundLogger.error(err, 'Error downloading object.')
        } else {
          boundLogger.info(
            `Downloaded object (size: ${gzipStream.bytesWritten / 1000000} MB)`
          )
        }
      }
    )
  })

  app.options('/objects/:streamId/:objectId/single', corsMiddleware())
  app.get('/objects/:streamId/:objectId/single', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
    const getObject = getFormattedObjectFactory({ db: projectDb })

    const obj = await getObject({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })

    if (!obj) {
      boundLogger.warn('Failed to find object.')
      return res.status(404).send('Failed to find object.')
    }

    boundLogger.info('Downloaded single object.')

    res.send(obj.data)
  })
}
