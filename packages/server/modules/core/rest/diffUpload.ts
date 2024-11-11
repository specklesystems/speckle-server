import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import { chunk } from 'lodash'
import type { Application } from 'express'
import { hasObjectsFactory } from '@/modules/core/repositories/objects'
import { validatePermissionsWriteStreamFactory } from '@/modules/core/services/streams/auth'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

export default (app: Application) => {
  const validatePermissionsWriteStream = validatePermissionsWriteStreamFactory({
    validateScopes,
    authorizeResolver
  })

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

    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
    const hasObjects = hasObjectsFactory({ db: projectDb })
    const objectList = JSON.parse(req.body.objects)

    req.log.info({ objectCount: objectList.length }, 'Diffing {objectCount} objects.')

    const chunkSize = 1000
    const objectListChunks = chunk(objectList, chunkSize)
    const mappedObjects = await Promise.all(
      objectListChunks.map((objectListChunk) =>
        hasObjects({
          streamId: req.params.streamId,
          objectIds: objectListChunk as string[]
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
