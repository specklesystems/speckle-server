import type { Application, RequestHandler } from 'express'
import { pipeline, PassThrough } from 'stream'
import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { validatePermissionsReadStream } from '@/modules/core/rest/authUtils'
import { SpeckleObjectsStream } from '@/modules/core/rest/speckleObjectsStream'
import { getObjectsStream } from '@/modules/core/services/objects'
import { toMegabytesWith1DecimalPlace } from '@/modules/core/utils/formatting'

export default (app: Application) => {
  app.options('/api/getobjects/:streamId', corsMiddleware())

  app.post('/api/getobjects/:streamId', corsMiddleware(), handleGetObjectsFromStream)
}

const handleGetObjectsFromStream: RequestHandler = async (req, res) => {
  req.log = req.log.child({
    userId: req.context.userId || '-',
    streamId: req.params.streamId
  })
  const hasStreamAccess = await validatePermissionsReadStream(req.params.streamId, req)
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
      let errMessage =
        'App error while streaming objects. Streamed {childCount} objects (size: {mbWritten} MB).'
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'ERR_STREAM_PREMATURE_CLOSE'
      ) {
        errMessage =
          'Client prematurely closed connection.  Streamed {childCount} objects (size: {mbWritten} MB).'
      }
      req.log.error(
        {
          err,
          childCount: childrenList.length,
          mbWritten: toMegabytesWith1DecimalPlace(gzipStream.bytesWritten)
        },
        errMessage
      )

      res.writeHead(499) // overwrite the status code to 499 (client closed connection)
      speckleObjStream.emit('error', new Error(errMessage))
      speckleObjStream.end() //FIXME does ending the speckleObjStream also send a response to the client, or do we need to call this as well?
    }
  )

  const cSize = 1000
  try {
    for (let cStart = 0; cStart < childrenList.length; cStart += cSize) {
      const childrenChunk = childrenList.slice(cStart, cStart + cSize)

      const dbStream = await getObjectsStream({
        streamId: req.params.streamId,
        objectIds: childrenChunk
      })
      await new Promise((resolve, reject) => {
        dbStream.pipe(speckleObjStream, { end: false })
        dbStream.once('end', resolve)
        dbStream.once('error', reject)
      })
    }
  } catch (ex) {
    req.log.error(ex, `DB Error streaming objects`)
    res.writeHead(500) //overwrite the status code to 500 (server error)
    speckleObjStream.emit('error', new Error('Database streaming error'))
  } finally {
    speckleObjStream.end() //FIXME does ending the speckleObjStream also send a response to the client, or do we need to call res.end() as well?
  }
}
