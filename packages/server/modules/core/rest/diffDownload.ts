// import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import type { Application } from 'express'
import { SpeckleObjectsStream } from '@/modules/core/rest/speckleObjectsStream'
import { Duplex, PassThrough, pipeline } from 'stream'
import { getObjectsStreamFactory } from '@/modules/core/repositories/objects'
import { db } from '@/db/knex'
import { validatePermissionsReadStreamFactory } from '@/modules/core/services/streams/auth'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { UserInputError } from '@/modules/core/errors/userinput'
import { ensureError } from '@speckle/shared'
import chain from 'stream-chain'
import { get } from 'lodash'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_OBJECTS_STREAMING_FIX } = getFeatureFlags()

export default (app: Application) => {
  const validatePermissionsReadStream = validatePermissionsReadStreamFactory({
    getStream: getStreamFactory({ db }),
    validateScopes,
    authorizeResolver
  })

  app.options('/api/getobjects/:streamId', corsMiddleware())

  app.post('/api/getobjects/:streamId', corsMiddleware(), async (req, res) => {
    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })
    res.on('finish', () => {
      res.log.info('Response has finished')
    })
    res.on('close', () => {
      res.log.info('Response has closed')
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
      req.log.info(`Received request to stream ${childrenList.length} objects`)
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
    speckleObjStream.on('end', () => {
      req.log.info('Speckle objects stream has ended')
    })
    speckleObjStream.on('close', () => {
      req.log.info('Speckle objects stream has closed')
    })
    // const gzipStream = zlib.createGzip()
    // gzipStream.on('end', () => {
    //   req.log.info('Gzip stream has ended')
    // })
    // gzipStream.on('close', () => {
    //   req.log.info('Gzip stream has closed')
    // })

    let chainPipeline: Duplex

    if (FF_OBJECTS_STREAMING_FIX) {
      // From node documentation: https://nodejs.org/docs/latest-v18.x/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback
      //    > stream.pipeline() leaves dangling event listeners on the streams after the callback has been invoked. In the case of reuse of streams after failure, this can cause event listener leaks and swallowed errors.
      // As workaround, we are using chain from 'stream-chain'
      // Some more conversation around this: https://stackoverflow.com/questions/61072482/node-closing-streams-properly-after-pipeline
      chainPipeline = chain([
        speckleObjStream,
        // gzipStream,
        new PassThrough({ highWaterMark: 16384 * 31 }),
        res
      ])
      chainPipeline.on('finish', () => {
        req.log.info('Chain pipeline has finished')
      })

      chainPipeline.on('end', () => {
        req.log.info('Chain pipeline has ended')
      })
      chainPipeline.on('close', () => {
        req.log.info('Chain pipeline has closed')
      })
      chainPipeline.on('error', (err) => {
        if (err) {
          switch (get(err, 'code')) {
            case 'ERR_STREAM_PREMATURE_CLOSE':
              req.log.info({ err }, 'Stream to client has prematurely closed')
              break
            default:
              req.log.error(err, 'App error streaming objects')
              break
          }
          return
        }

        req.log.info(
          {
            childCount: childrenList.length
            // mbWritten: gzipStream.bytesWritten / 1000000
          },
          'Encountered error. Prior to error, we streamed {childCount} objects (size: {mbWritten} MB)'
        )
      })
    } else {
      req.log.info('Create stream.pipeline for streaming objects')
      pipeline(
        speckleObjStream,
        // gzipStream,
        new PassThrough({ highWaterMark: 16384 * 31 }),
        res,
        (err) => {
          if (err) {
            switch (err.code) {
              case 'ERR_STREAM_PREMATURE_CLOSE':
                req.log.info({ err }, 'Stream to client has prematurely closed')
                break
              default:
                req.log.error(err, 'App error streaming objects')
                break
            }
          } else {
            req.log.info(
              {
                childCount: childrenList.length
                // mbWritten: gzipStream.bytesWritten / 1000000
              },
              'Streamed {childCount} objects (size: {mbWritten} MB)'
            )
          }
        }
      )
    }

    const cSize = 1000
    try {
      for (let cStart = 0; cStart < childrenList.length; cStart += cSize) {
        if (!speckleObjStream.writable) {
          req.log.info('Client disconnected. Stopping streaming.')
          break
        }

        req.log.info(`Streaming 1000 objects from index ${cStart}`)
        const childrenChunk = childrenList.slice(cStart, cStart + cSize)

        const dbStream = await getObjectsStream({
          streamId: req.params.streamId,
          objectIds: childrenChunk
        })
        // https://knexjs.org/faq/recipes.html#manually-closing-streams
        // https://github.com/knex/knex/issues/2324
        res.on('close', () => {
          req.log.info("Client has sent a 'close' event; Closing DB stream.")
          // dbStream.end.bind(dbStream)
          dbStream.end()
          dbStream.destroy()
          // dbStream.destroy.bind(dbStream)
        })

        await new Promise((resolve, reject) => {
          dbStream.once('end', () => {
            req.log.info(
              `End event received from DB stream for objects from index ${cStart}`
            )
            return resolve
          })
          dbStream.once('close', () => {
            req.log.info(
              `Close event received from DB stream for objects from index ${cStart}`
            )
          })
          dbStream.once('error', (err) => {
            req.log.error(`Error in DB stream for objects from index ${cStart}: ${err}`)
            return reject
          })

          if (FF_OBJECTS_STREAMING_FIX) {
            req.log.info(
              `Using chain pipeline for streaming objects from index ${cStart}`
            )
            dbStream.pipe(chainPipeline, { end: false }) // will not call end on the speckleObjStream, so it remains open for the next batch of objects
          } else {
            req.log.info(
              `Using pipe into speckleObjStream for streaming objects from index ${cStart}`
            )
            dbStream.pipe(speckleObjStream, { end: false }) // will not call end on the speckleObjStream, so it remains open for the next batch of objects
          }
        })
      }
    } catch (ex) {
      req.log.error(ex, `DB Error streaming objects`)
      speckleObjStream.emit('error', new Error('Database streaming error'))
    } finally {
      // if (FF_OBJECTS_STREAMING_FIX) {
      // chainPipeline!.end()
      // } else {
      req.log.info('Closing speckleObjStream')
      speckleObjStream.end()
      // }
    }
  })
}
