import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import type { Application } from 'express'
import { validatePermissionsReadStream } from '@/modules/core/rest/authUtils'
import { SpeckleObjectsStream } from '@/modules/core/rest/speckleObjectsStream'
import { getObjectsStream } from '@/modules/core/services/objects'
import { pipeline, PassThrough } from 'stream'
import { HttpMethod, OpenApiDocument } from '@/modules/shared/helpers/typeHelper'

export default (params: { app: Application; openApiDocument: OpenApiDocument }) => {
  const { app, openApiDocument } = params
  app.options('/api/getobjects/:streamId', corsMiddleware())
  openApiDocument.registerOperation('/api/getobjects/{streamId}', HttpMethod.OPTIONS, {
    description: 'Options for the endpoint',
    parameters: [
      {
        name: 'streamId',
        in: 'path',
        description: 'ID of the stream',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ],
    responses: {
      200: {
        description: 'Options were retrieved.'
      }
    }
  })

  app.post('/api/getobjects/:streamId', corsMiddleware(), async (req, res) => {
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

    const childrenList = JSON.parse(req.body.objects)
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

        const speckleObjStreamCloseHandler = () => {
          // https://knexjs.org/faq/recipes.html#manually-closing-streams
          dbStream.end.bind(dbStream)
        }

        speckleObjStream.once('close', speckleObjStreamCloseHandler)

        await new Promise((resolve, reject) => {
          dbStream.pipe(speckleObjStream, { end: false })
          dbStream.once('end', resolve)
          dbStream.once('error', reject)
        })

        speckleObjStream.removeListener('close', speckleObjStreamCloseHandler)
      }
    } catch (ex) {
      req.log.error(ex, `DB Error streaming objects`)
      speckleObjStream.emit('error', new Error('Database streaming error'))
    } finally {
      speckleObjStream.end()
    }
  })
  openApiDocument.registerOperation('/api/getobjects/{streamId}', HttpMethod.POST, {
    description: 'Get all objects for a project (stream)',
    parameters: [
      {
        name: 'streamId',
        in: 'path',
        description: 'ID of the stream',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              objects: {
                type: 'array',
                items: {
                  type: 'string'
                }
              }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'All objects were successfully retrieved.'
      }
    }
  })
}
