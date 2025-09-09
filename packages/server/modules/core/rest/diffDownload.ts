import zlib from 'zlib'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import type { Application } from 'express'
import {
  objectDataTransformFactory,
  SpeckleObjectsStream
} from '@/modules/core/rest/speckleObjectsStream'
import { pipeline, PassThrough, Readable } from 'stream'
import {
  getObjectsStreamFactory,
  getProjectObjectStreamFactory
} from '@/modules/core/repositories/objects'
import { db } from '@/db/knex'
import { validatePermissionsReadStreamFactory } from '@/modules/core/services/streams/auth'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { UserInputError } from '@/modules/core/errors/userinput'
import { ensureError, Roles, Scopes } from '@speckle/shared'
import { DatabaseError } from '@/modules/shared/errors'
import { validateRequest } from 'zod-express'
import { z } from 'zod'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import {
  streamReadPermissionsPipelineFactory,
  validateScope,
  validateServerRoleBuilderFactory
} from '@/modules/shared/authz'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { chunk, constant, flatten, times } from 'lodash-es'

export default (app: Application) => {
  const validatePermissionsReadStream = validatePermissionsReadStreamFactory({
    getStream: getStreamFactory({ db }),
    validateScopes,
    authorizeResolver
  })

  app.options('/api/getobjects/:streamId', corsMiddlewareFactory())

  app.post('/api/getobjects/:streamId', corsMiddlewareFactory(), async (req, res) => {
    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })

    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
    const getObjectsStream = getObjectsStreamFactory({ db: projectDb })
    let childrenList: string[]
    try {
      childrenList = JSON.parse(req.body.objects)
    } catch (err) {
      throw new UserInputError(
        'Invalid body. Please provide a JSON object containing the property "objects" of type string. The value must be a JSON string representation of an array of object IDs.',
        ensureError(err, 'Unknown JSON parsing issue')
      )
    }
    const simpleText = req.headers.accept === 'text/plain'

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    // "output" stream, connected to res with `pipeline` (auto-closing res)
    const speckleObjStream = new SpeckleObjectsStream(simpleText)
    const gzipStream = zlib.createGzip()
    pipeline(
      speckleObjStream,
      gzipStream,
      new PassThrough({ highWaterMark: 16384 * 31 }),
      res,
      (err) => {
        if (err) {
          switch (err.code) {
            case 'ERR_STREAM_PREMATURE_CLOSE':
              req.log.debug({ err }, 'Stream to client has prematurely closed')
              break
            default:
              req.log.error(err, 'App error streaming objects')
              break
          }
          return
        }
        req.log.info(
          {
            childCount: childrenList.length,
            mbWritten: gzipStream.bytesWritten / 1000000
          },
          'Streamed {childCount} objects (size: {mbWritten} MB)'
        )
      }
    )

    const cSize = 1000
    try {
      for (let cStart = 0; cStart < childrenList.length; cStart += cSize) {
        if (!speckleObjStream.writable) break
        const childrenChunk = childrenList.slice(cStart, cStart + cSize)

        const dbStream = await getObjectsStream({
          streamId: req.params.streamId,
          objectIds: childrenChunk
        })

        // https://knexjs.org/faq/recipes.html#manually-closing-streams
        // https://github.com/knex/knex/issues/2324
        const responseCloseHandler = () => {
          dbStream.end()
          dbStream.destroy()
        }

        dbStream.on('close', () => {
          res.removeListener('close', responseCloseHandler)
        })
        res.on('close', responseCloseHandler)

        await new Promise((resolve, reject) => {
          dbStream.once('end', resolve)
          dbStream.once('error', reject)
          dbStream.pipe(speckleObjStream, { end: false }) // will not call end on the speckleObjStream, so it remains open for the next batch of objects
        })
      }
    } catch (ex) {
      req.log.error(ex, `DB Error streaming objects`)
      speckleObjStream.emit('error', new DatabaseError('Database streaming error'))
    } finally {
      speckleObjStream.end()
    }
  })

  app.options('/api/v2/project/:streamId/object-stream', corsMiddlewareFactory())
  app.post(
    '/api/v2/project/:streamId/createObjectStream',
    corsMiddlewareFactory(),
    authMiddlewareCreator([
      ...streamReadPermissionsPipelineFactory({
        getStream: getStreamFactory({ db })
      })
    ]),
    validateRequest({
      body: z.object({
        objectIds: z.string().array().min(1),
        attributeMask: z
          .union([
            z.object({ include: z.string().array().min(1) }),
            z.object({ exclude: z.string().array().min(1) })
          ])
          .optional()
      })
    }),
    async ({ body: { objectIds, attributeMask }, params: { streamId }, log }, res) => {
      const projectId = streamId
      const projectDb = await getProjectDbClient({ projectId })

      const streamObjectsFromDb = getProjectObjectStreamFactory({ db: projectDb })

      res.writeHead(200, {
        'Content-Encoding': 'gzip',
        'Content-Type': 'text/plain; charset=UTF-8'
      })
      const objectDataTransform = objectDataTransformFactory({ attributeMask })

      const gzipStream = zlib.createGzip()
      pipeline(
        objectDataTransform,
        gzipStream,
        new PassThrough({ highWaterMark: 16384 * 31 }),
        res,
        (err) => {
          if (err) {
            switch (err.code) {
              case 'ERR_STREAM_PREMATURE_CLOSE':
                log.debug({ err }, 'Stream to client has prematurely closed')
                break
              default:
                log.error(err, 'App error streaming objects')
                break
            }
            return
          }
          log.info(
            {
              childCount: objectIds.length,
              mbWritten: gzipStream.bytesWritten / 1000000
            },
            'Streamed {childCount} objects (size: {mbWritten} MB)'
          )
        }
      )
      const maxBatchSize = 1000

      // TODO, this could potentially be sped up a bit, if we concurrently
      // pipe multiple db streams into the transform
      for (const objectIdChunk of chunk(objectIds, maxBatchSize)) {
        const objectStream = streamObjectsFromDb({
          projectId,
          objectIds: objectIdChunk
        })
        await new Promise((resolve, reject) => {
          objectStream.once('end', resolve)
          objectStream.once('error', reject)
          // this is here, to make sure event handlers are registerd before piping the stream
          objectStream.pipe(objectDataTransform, { end: false })
        })
      }
      objectDataTransform.end()
    }
  )
}
