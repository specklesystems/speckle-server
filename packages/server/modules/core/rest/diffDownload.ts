import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import type { Application } from 'express'
import { validatePermissionsReadStream } from '@/modules/core/rest/authUtils'
import { SpeckleObjectsStream } from '@/modules/core/rest/speckleObjectsStream'
import { getObjectsStream } from '@/modules/core/services/objects'
import { pipeline, PassThrough } from 'stream'

export default (app: Application) => {
  app.options('/api/getobjects/:streamId', corsMiddleware())

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
          dbStream.destroy()
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
}
