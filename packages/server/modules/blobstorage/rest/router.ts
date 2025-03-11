import {
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowAnonymousUsersOnPublicStreams,
  streamWritePermissionsPipelineFactory,
  streamReadPermissionsPipelineFactory
} from '@/modules/shared/authz'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { isArray } from 'lodash'
import { UnauthorizedError } from '@/modules/shared/errors'
import {
  getAllStreamBlobIdsFactory,
  getBlobMetadataFactory,
  getBlobMetadataCollectionFactory,
  deleteBlobFactory
} from '@/modules/blobstorage/repositories'
import { db } from '@/db/knex'
import {
  getFileStreamFactory,
  fullyDeleteBlobFactory
} from '@/modules/blobstorage/services/management'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import { Router } from 'express'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'
import {
  deleteObjectFactory,
  getObjectStreamFactory
} from '@/modules/blobstorage/repositories/blobs'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { processNewFileStreamFactory } from '@/modules/blobstorage/services/streams'
import { UserInputError } from '@/modules/core/errors/userinput'
import { createBusboy } from '@/modules/blobstorage/rest/busboy'

export const blobStorageRouterFactory = (): Router => {
  const createStreamWritePermissions = () =>
    streamWritePermissionsPipelineFactory({
      getRoles: getRolesFactory({ db }),
      getStream: getStreamFactory({ db })
    })
  const createStreamReadPermissions = () =>
    streamReadPermissionsPipelineFactory({
      adminOverrideEnabled,
      getRoles: getRolesFactory({ db }),
      getStream: getStreamFactory({ db })
    })

  const processNewFileStream = processNewFileStreamFactory()

  const app = Router()

  app.post(
    '/api/stream/:streamId/blob',
    authMiddlewareCreator([
      ...createStreamWritePermissions(),
      // todo should we add public comments upload escape hatch?
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments
    ]),
    async (req, res) => {
      const streamId = req.params.streamId
      const userId = req.context.userId
      if (!userId) throw new UnauthorizedError()
      req.log = req.log.child({ streamId, userId })
      req.log.debug('Uploading blob.')

      const busboy = createBusboy(req)
      const newFileStreamProcessor = await processNewFileStream({
        busboy,
        streamId,
        userId,
        logger: req.log,
        onFinishAllFileUploads: async (uploadResults) => {
          res.status(201).send({ uploadResults })
        },
        onError: () => {
          res.contentType('application/json')
          res
            .status(400)
            .end(
              '{ "error": "Upload request error. The server logs may have more details." }'
            )
        }
      })
      req.pipe(newFileStreamProcessor)
    }
  )

  app.post(
    '/api/stream/:streamId/blob/diff',
    authMiddlewareCreator([
      ...createStreamReadPermissions(),
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
      allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
      allowAnonymousUsersOnPublicStreams
    ]),
    async (req, res) => {
      if (!isArray(req.body)) {
        throw new UserInputError('An array of blob IDs expected in the body.')
      }

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

      const getAllStreamBlobIds = getAllStreamBlobIdsFactory({ db: projectDb })
      const bq = await getAllStreamBlobIds({ streamId: req.params.streamId })
      const unknownBlobIds = [...req.body].filter(
        (id) => bq.findIndex((bInfo) => bInfo.id === id) === -1
      )
      res.send(unknownBlobIds)
    }
  )

  app.get(
    '/api/stream/:streamId/blob/:blobId',
    authMiddlewareCreator([
      ...createStreamReadPermissions(),
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
      allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
      allowAnonymousUsersOnPublicStreams
    ]),
    async (req, res) => {
      const streamId = req.params.streamId
      const [projectDb, projectStorage] = await Promise.all([
        getProjectDbClient({ projectId: streamId }),
        getProjectObjectStorage({ projectId: streamId })
      ])

      const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
      const getFileStream = getFileStreamFactory({ getBlobMetadata })
      const getObjectStream = getObjectStreamFactory({ storage: projectStorage })

      const { fileName } = await getBlobMetadata({
        streamId: req.params.streamId,
        blobId: req.params.blobId
      })
      const fileStream = await getFileStream({
        getObjectStream,
        streamId: req.params.streamId,
        blobId: req.params.blobId
      })
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`
      })
      fileStream.pipe(res)
    }
  )

  app.delete(
    '/api/stream/:streamId/blob/:blobId',
    authMiddlewareCreator(createStreamReadPermissions()),
    async (req, res) => {
      const streamId = req.params.streamId
      const [projectDb, projectStorage] = await Promise.all([
        getProjectDbClient({ projectId: streamId }),
        getProjectObjectStorage({ projectId: streamId })
      ])

      const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
      const deleteObject = deleteObjectFactory({ storage: projectStorage })
      const deleteBlob = fullyDeleteBlobFactory({
        getBlobMetadata,
        deleteBlob: deleteBlobFactory({ db: projectDb }),
        deleteObject
      })

      await deleteBlob({
        streamId: req.params.streamId,
        blobId: req.params.blobId
      })
      res.status(204).send()
    }
  )

  app.get(
    '/api/stream/:streamId/blobs',
    authMiddlewareCreator(createStreamReadPermissions()),
    async (req, res) => {
      let fileName = req.query.fileName //filename can be undefined or null, and that returns all blobs
      if (isArray(fileName)) {
        fileName = fileName[0]
      }

      const streamId = req.params.streamId

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const getBlobMetadataCollection = getBlobMetadataCollectionFactory({
        db: projectDb
      })

      const blobMetadataCollection = await getBlobMetadataCollection({
        streamId,
        query: fileName as string
      })

      return res.status(200).send(blobMetadataCollection)
    }
  )

  app.delete('/api/stream/:streamId/blobs', async (_req, res) => {
    return res.status(501).send('This method is not implemented yet.')
  })

  return app
}
