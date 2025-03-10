import zlib from 'zlib'
import { corsMiddlewareFactory } from '@/modules/core/configs/cors'
import { chunk } from 'lodash'
import type { Application } from 'express'
import { hasObjectsFactory } from '@/modules/core/repositories/objects'
import { validatePermissionsWriteStreamFactory } from '@/modules/core/services/streams/auth'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { UserInputError } from '@/modules/core/errors/userinput'
import { ensureError } from '@speckle/shared'
import { pipeline } from 'stream'

export default (app: Application) => {
  const validatePermissionsWriteStream = validatePermissionsWriteStreamFactory({
    validateScopes,
    authorizeResolver
  })

  app.options('/api/diff/:streamId', corsMiddlewareFactory())

  app.post('/api/diff/:streamId', corsMiddlewareFactory(), async (req, res) => {
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
    let objectList: string[]
    try {
      objectList = JSON.parse(req.body.objects)
    } catch (err) {
      throw new UserInputError(
        'Invalid body. Please provide a JSON object containing the property "objects" of type string. The value must be a JSON string representation of an array of object IDs.',
        ensureError(err, 'Unknown JSON parsing issue')
      )
    }

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
    pipeline(gzip, res)
  })
}
