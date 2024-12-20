import Busboy from 'busboy'
import {
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowAnonymousUsersOnPublicStreams,
  streamWritePermissionsPipelineFactory,
  streamReadPermissionsPipelineFactory
} from '@/modules/shared/authz'
import crs from 'crypto-random-string'
import { authMiddlewareCreator } from '@/modules/shared/middleware'
import { isArray } from 'lodash'

import {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} from '@/modules/shared/errors'
import { moduleLogger, logger } from '@/logging/logging'
import {
  getAllStreamBlobIdsFactory,
  upsertBlobFactory,
  updateBlobFactory,
  getBlobMetadataFactory,
  getBlobMetadataCollectionFactory,
  deleteBlobFactory
} from '@/modules/blobstorage/repositories'
import { db } from '@/db/knex'
import {
  uploadFileStreamFactory,
  getFileStreamFactory,
  getFileSizeLimit,
  markUploadSuccessFactory,
  markUploadErrorFactory,
  markUploadOverFileSizeLimitFactory,
  fullyDeleteBlobFactory
} from '@/modules/blobstorage/services/management'
import { getRolesFactory } from '@/modules/shared/repositories/roles'
import {
  adminOverrideEnabled,
  createS3Bucket
} from '@/modules/shared/helpers/envHelper'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { Request, Response } from 'express'
import { ensureError } from '@speckle/shared'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  deleteObjectFactory,
  ensureStorageAccessFactory,
  getObjectAttributesFactory,
  getObjectStreamFactory,
  storeFileStreamFactory
} from '@/modules/blobstorage/repositories/blobs'
import { getMainObjectStorage } from '@/modules/blobstorage/clients/objectStorage'
import { getProjectObjectStorage } from '@/modules/multiregion/utils/blobStorageSelector'

const ensureConditions = async () => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    moduleLogger.info('📦 Blob storage is DISABLED')
    return
  } else {
    moduleLogger.info('📦 Init BlobStorage module')
    const storage = getMainObjectStorage()
    const ensureStorageAccess = ensureStorageAccessFactory({ storage })
    await ensureStorageAccess({
      createBucketIfNotExists: createS3Bucket()
    })
  }

  if (!process.env.S3_BUCKET) {
    logger.warn(
      'S3_BUCKET env variable was not specified. 📦 BlobStorage will be DISABLED.'
    )
    return
  }
}

type ErrorHandler = (
  req: Request,
  res: Response,
  callback: (req: Request, res: Response) => Promise<void>
) => Promise<void>
const errorHandler: ErrorHandler = async (req, res, callback) => {
  try {
    await callback(req, res)
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).send({ error: err.message })
    } else if (err instanceof ResourceMismatch || err instanceof BadRequestError) {
      res.status(400).send({ error: err.message })
    } else {
      res.status(500).send({ error: ensureError(err, 'Unknown error').message })
    }
  }
}

export const init: SpeckleModule['init'] = async (app) => {
  await ensureConditions()
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

  app.post(
    '/api/stream/:streamId/blob',
    async (req, res, next) => {
      await authMiddlewareCreator([
        ...createStreamWritePermissions(),
        // todo should we add public comments upload escape hatch?
        allowForAllRegisteredUsersOnPublicStreamsWithPublicComments
      ])(req, res, next)
    },
    async (req, res) => {
      const streamId = req.params.streamId
      req.log = req.log.child({ streamId, userId: req.context.userId })
      req.log.debug('Uploading blob.')
      // no checking of startup conditions, just dont init the endpoints if not configured right
      //authorize request
      const uploadOperations: Record<string, unknown> = {}
      const finalizePromises: Promise<{
        uploadStatus?: number
        uploadError?: Error | null | string
        formKey: string
      }>[] = []
      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: getFileSizeLimit() }
      })

      const [projectDb, projectStorage] = await Promise.all([
        getProjectDbClient({ projectId: streamId }),
        getProjectObjectStorage({ projectId: streamId })
      ])

      const storeFileStream = storeFileStreamFactory({ storage: projectStorage })
      const updateBlob = updateBlobFactory({ db: projectDb })
      const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })

      const uploadFileStream = uploadFileStreamFactory({
        storeFileStream,
        upsertBlob: upsertBlobFactory({ db: projectDb }),
        updateBlob
      })

      const markUploadSuccess = markUploadSuccessFactory({
        getBlobMetadata,
        updateBlob
      })
      const markUploadError = markUploadErrorFactory({ getBlobMetadata, updateBlob })
      const markUploadOverFileSizeLimit = markUploadOverFileSizeLimitFactory({
        getBlobMetadata,
        updateBlob
      })

      const getObjectAttributes = getObjectAttributesFactory({
        storage: projectStorage
      })
      const deleteObject = deleteObjectFactory({ storage: projectStorage })

      busboy.on('file', (formKey, file, info) => {
        const { filename: fileName } = info
        const fileType = fileName?.split('.')?.pop()?.toLowerCase()
        req.log = req.log.child({ fileName, fileType })
        const registerUploadResult = (
          processingPromise: Promise<{
            uploadStatus?: number
            uploadError?: Error | null | string
          }>
        ) => {
          finalizePromises.push(
            processingPromise.then((resultItem) => ({ ...resultItem, formKey }))
          )
        }

        let blobId = crs({ length: 10 })
        let clientHash = null
        if (formKey.includes('hash:')) {
          clientHash = formKey.split(':')[1]
          if (clientHash && clientHash !== '') {
            // logger.debug(`I have a client hash (${clientHash})`)
            blobId = clientHash
          }
        }

        req.log = req.log.child({ blobId })

        uploadOperations[blobId] = uploadFileStream(
          { streamId, userId: req.context.userId },
          { blobId, fileName, fileType, fileStream: file }
        )

        //this file level 'close' is fired when a single file upload finishes
        //this way individual upload statuses can be updated, when done
        file.on('close', async () => {
          //this is handled by the file.on('limit', ...) event
          if (file.truncated) return
          await uploadOperations[blobId]

          registerUploadResult(markUploadSuccess(getObjectAttributes, streamId, blobId))
        })

        file.on('limit', async () => {
          await uploadOperations[blobId]
          registerUploadResult(
            markUploadOverFileSizeLimit(deleteObject, streamId, blobId)
          )
        })

        file.on('error', (err) => {
          registerUploadResult(
            markUploadError(deleteObject, streamId, blobId, err.message)
          )
        })
      })

      busboy.on('finish', async () => {
        // make sure all upload operations have been awaited,
        // otherwise the finish even can fire before all async operations finish
        //resulting in missing return values
        await Promise.all(Object.values(uploadOperations))
        // have to make sure all finalize promises have been awaited
        const uploadResults = await Promise.all(finalizePromises)
        res.status(201).send({ uploadResults })
      })

      busboy.on('error', async (err) => {
        req.log.info({ err }, 'Upload request error.')
        //delete all started uploads
        await Promise.all(
          Object.keys(uploadOperations).map((blobId) =>
            markUploadError(
              deleteObject,
              streamId,
              blobId,
              ensureError(err, 'Unknown error while uploading blob').message
            )
          )
        )

        res.contentType('application/json')
        res
          .status(400)
          .end(
            '{ "error": "Upload request error. The server logs may have more details." }'
          )
      })

      req.pipe(busboy)
    }
  )

  app.post(
    '/api/stream/:streamId/blob/diff',
    async (req, res, next) => {
      await authMiddlewareCreator([
        ...createStreamReadPermissions(),
        allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
        allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
        allowAnonymousUsersOnPublicStreams
      ])(req, res, next)
    },
    async (req, res) => {
      if (!isArray(req.body)) {
        return res
          .status(400)
          .json({ error: 'An array of blob IDs expected in the body.' })
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
    async (req, res, next) => {
      await authMiddlewareCreator([
        ...createStreamReadPermissions(),
        allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
        allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
        allowAnonymousUsersOnPublicStreams
      ])(req, res, next)
    },
    async (req, res) => {
      errorHandler(req, res, async (req, res) => {
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
      })
    }
  )

  app.delete(
    '/api/stream/:streamId/blob/:blobId',
    async (req, res, next) => {
      await authMiddlewareCreator(createStreamReadPermissions())(req, res, next)
    },
    async (req, res) => {
      errorHandler(req, res, async (req, res) => {
        const streamId = req.params.streamId
        const [projectDb, projectStorage] = await Promise.all([
          getProjectDbClient({ projectId: streamId }),
          getProjectObjectStorage({ projectId: streamId })
        ])

        const getBlobMetadata = getBlobMetadataFactory({ db: projectDb })
        const deleteBlob = fullyDeleteBlobFactory({
          getBlobMetadata,
          deleteBlob: deleteBlobFactory({ db: projectDb })
        })
        const deleteObject = deleteObjectFactory({ storage: projectStorage })

        await deleteBlob({
          streamId: req.params.streamId,
          blobId: req.params.blobId,
          deleteObject
        })
        res.status(204).send()
      })
    }
  )

  app.get(
    '/api/stream/:streamId/blobs',
    async (req, res, next) => {
      await authMiddlewareCreator(createStreamReadPermissions())(req, res, next)
    },
    async (req, res) => {
      let fileName = req.query.fileName
      if (isArray(fileName)) {
        fileName = fileName[0]
      }

      const projectDb = await getProjectDbClient({ projectId: req.params.streamId })
      const getBlobMetadataCollection = getBlobMetadataCollectionFactory({
        db: projectDb
      })
      errorHandler(req, res, async (req, res) => {
        const blobMetadataCollection = await getBlobMetadataCollection({
          streamId: req.params.streamId,
          query: fileName as string
        })

        res.status(200).send(blobMetadataCollection)
      })
    }
  )

  app.delete('/api/stream/:streamId/blobs', async (req, res) => {
    res.status(501).send('This method is not implemented yet.')
  })
}

export const finalize: SpeckleModule['finalize'] = () => {}
