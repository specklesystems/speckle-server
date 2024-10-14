import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { validatePermissionsWriteStream } from '@/modules/core/rest/authUtils'
import { hasObjects } from '@/modules/core/services/objects'
import { chunk } from 'lodash'
import type { Application } from 'express'

export default (app: Application) => {
  app.options('/api/diff/:streamId', corsMiddleware())

  app.post('/api/diff/:streamId', corsMiddleware(), async (req, res) => {
    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })
    const hasStreamAccess = await validatePermissionsWriteStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const objectList = JSON.parse(req.body.objects)

    req.log.info({ objectCount: objectList.length }, 'Diffing {objectCount} objects.')

    const chunkSize = 1000
    const objectListChunks = chunk(objectList, chunkSize)
    const mappedObjects = await Promise.all(
      objectListChunks.map((objectListChunk) =>
        hasObjects({
          streamId: req.params.streamId,
          objectIds: objectListChunk
        })
      )
    )
    const response = {}
    Object.assign(response, ...mappedObjects)

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': 'application/json'
    })
    const gzip = zlib.createGzip()
    gzip.write(JSON.stringify(response))
    gzip.flush()
    gzip.end()
    gzip.pipe(res)
  })
}
