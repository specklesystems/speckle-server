const Busboy = require('busboy')
const {
  streamReadPermissions,
  streamWritePermissions,
  allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
  allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
  allowAnonymousUsersOnPublicStreams
} = require('@/modules/shared/authz')
const {
  ensureStorageAccess,
  storeFileStream,
  getObjectStream,
  deleteObject,
  getObjectAttributes
} = require('@/modules/blobstorage/objectStorage')
const crs = require('crypto-random-string')
const { authMiddlewareCreator } = require('@/modules/shared/middleware')

const {
  uploadFileStream,
  getFileStream,
  markUploadError,
  markUploadSuccess,
  markUploadOverFileSizeLimit,
  deleteBlob,
  getBlobMetadata,
  getBlobMetadataCollection,
  getAllStreamBlobIds,
  getFileSizeLimit
} = require('@/modules/blobstorage/services')

const { isArray } = require('lodash')

const {
  NotFoundError,
  ResourceMismatch,
  BadRequestError
} = require('@/modules/shared/errors')
const { moduleLogger, logger } = require('@/logging/logging')

const ensureConditions = async () => {
  if (process.env.DISABLE_FILE_UPLOADS) {
    moduleLogger.info('📦 Blob storage is DISABLED')
    return
  } else {
    moduleLogger.info('📦 Init BlobStorage module')
    await ensureStorageAccess()
  }

  if (!process.env.S3_BUCKET) {
    logger.warn(
      'S3_BUCKET env variable was not specified. 📦 BlobStorage will be DISABLED.'
    )
    return
  }
}

const errorHandler = async (req, res, callback) => {
  try {
    await callback(req, res)
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).send({ error: err.message })
    } else if (err instanceof ResourceMismatch || err instanceof BadRequestError) {
      res.status(400).send({ error: err.message })
    } else {
      res.status(500).send({ error: err.message })
    }
  }
}

exports.init = async (app) => {
  await ensureConditions()
  // eslint-disable-next-line no-unused-vars
  app.post(
    '/api/stream/:streamId/blob',
    authMiddlewareCreator([
      ...streamWritePermissions,
      // todo should we add public comments upload escape hatch?
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments
    ]),
    async (req, res) => {
      // no checking of startup conditions, just dont init the endpoints if not configured right
      //authorize request
      const uploadOperations = {}
      const finalizePromises = []
      const busboy = Busboy({
        headers: req.headers,
        limits: { fileSize: getFileSizeLimit() }
      })
      const streamId = req.params.streamId

      busboy.on('file', (formKey, file, info) => {
        const { filename: fileName } = info
        const fileType = fileName.split('.').pop().toLowerCase()
        const registerUploadResult = (processingPromise) => {
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

        uploadOperations[blobId] = uploadFileStream(
          storeFileStream,
          { streamId, userId: req.context.userId },
          { blobId, fileName, fileType, fileStream: file, clientHash }
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
          registerUploadResult(markUploadError(deleteObject, blobId, err.message))
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
        logger.error(err, 'File upload error')
        //delete all started uploads
        await Promise.all(
          Object.keys(uploadOperations).map((blobId) =>
            markUploadError(deleteObject, streamId, blobId, err.message)
          )
        )

        const status = 400
        const response = 'Upload request error. The server logs have more details'

        res.status(status).end(response)
      })

      req.pipe(busboy)
    }
  )

  app.post(
    '/api/stream/:streamId/blob/diff',
    authMiddlewareCreator([
      ...streamReadPermissions,
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
      allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
      allowAnonymousUsersOnPublicStreams
    ]),
    async (req, res) => {
      if (!isArray(req.body)) {
        return res
          .status(400)
          .json({ error: 'An array of blob IDs expected in the body.' })
      }

      const bq = await getAllStreamBlobIds({ streamId: req.params.streamId })
      const unknownBlobIds = req.body.filter(
        (id) => bq.findIndex((bInfo) => bInfo.id === id) === -1
      )
      res.send(unknownBlobIds)
    }
  )

  app.get(
    '/api/stream/:streamId/blob/:blobId',
    authMiddlewareCreator([
      ...streamReadPermissions,
      allowForAllRegisteredUsersOnPublicStreamsWithPublicComments,
      allowForRegisteredUsersOnPublicStreamsEvenWithoutRole,
      allowAnonymousUsersOnPublicStreams
    ]),
    async (req, res) => {
      errorHandler(req, res, async (req, res) => {
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
    authMiddlewareCreator(streamWritePermissions),
    async (req, res) => {
      errorHandler(req, res, async (req, res) => {
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
    authMiddlewareCreator(streamWritePermissions),
    async (req, res) => {
      const fileName = req.query.fileName

      errorHandler(req, res, async (req, res) => {
        const blobMetadataCollection = await getBlobMetadataCollection({
          streamId: req.params.streamId,
          query: fileName
        })

        res.status(200).send(blobMetadataCollection)
      })
    }
  )

  app.delete(
    '/api/stream/:streamId/blobs',
    authMiddlewareCreator(streamWritePermissions)
    // async (req, res) => {}
  )
}

exports.finalize = () => {}
