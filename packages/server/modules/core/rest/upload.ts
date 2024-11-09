import zlib from 'zlib'
import { corsMiddleware } from '@/modules/core/configs/cors'
import Busboy from 'busboy'
import {
  getFeatureFlags,
  maximumObjectUploadFileSizeMb
} from '@/modules/shared/helpers/envHelper'
import { ObjectHandlingError } from '@/modules/core/errors/object'
import { estimateStringMegabyteSize } from '@/modules/core/utils/chunking'
import { toMegabytesWith1DecimalPlace } from '@/modules/core/utils/formatting'
import { Router } from 'express'
import {
  createObjectsBatchedAndNoClosuresFactory,
  createObjectsBatchedFactory
} from '@/modules/core/services/objects/management'
import {
  storeClosuresIfNotFoundFactory,
  storeObjectsIfNotFoundFactory
} from '@/modules/core/repositories/objects'
import { validatePermissionsWriteStreamFactory } from '@/modules/core/services/streams/auth'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

const MAX_FILE_SIZE = maximumObjectUploadFileSizeMb() * 1024 * 1024
const { FF_NO_CLOSURE_WRITES } = getFeatureFlags()

export default (app: Router) => {
  const validatePermissionsWriteStream = validatePermissionsWriteStreamFactory({
    validateScopes,
    authorizeResolver
  })

  app.options('/objects/:streamId', corsMiddleware())

  app.post('/objects/:streamId', corsMiddleware(), async (req, res) => {
    const calculateLogMetadata = (params: {
      batchSizeMb: number
      start: number
      batchStartTime: number
      totalObjectsProcessed: number
    }) => {
      return {
        batchSizeMb: params.batchSizeMb,
        maxFileSizeMb: toMegabytesWith1DecimalPlace(MAX_FILE_SIZE),
        elapsedTimeMs: Date.now() - params.start,
        batchElapsedTimeMs: Date.now() - params.batchStartTime,
        totalObjectsProcessed: params.totalObjectsProcessed
      }
    }

    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })

    const start = Date.now()

    const hasStreamAccess = await validatePermissionsWriteStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const projectDb = await getProjectDbClient({ projectId: req.params.streamId })

    const objectInsertionService = FF_NO_CLOSURE_WRITES
      ? createObjectsBatchedAndNoClosuresFactory({
          storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({
            db: projectDb
          })
        })
      : createObjectsBatchedFactory({
          storeObjectsIfNotFoundFactory: storeObjectsIfNotFoundFactory({
            db: projectDb
          }),
          storeClosuresIfNotFound: storeClosuresIfNotFoundFactory({ db: projectDb })
        })

    let busboy
    try {
      busboy = Busboy({ headers: req.headers })
    } catch (e) {
      req.log.warn(
        e,
        'Failed to parse request headers and body content as valid multipart/form-data.'
      )
      return res
        .status(400)
        .send(
          'Failed to parse request headers and body content as valid multipart/form-data.'
        )
    }
    let totalObjectsProcessed = 0

    const promises: Promise<boolean | void | string[]>[] = []
    let requestDropped = false

    busboy.on('file', (name, file, info) => {
      const { mimeType } = info

      if (requestDropped) return

      if (mimeType === 'application/gzip') {
        const buffer: Uint8Array[] = []

        file.on('data', (data) => {
          if (data) buffer.push(data)
        })

        file.on('end', async () => {
          req.log.info(
            `File upload of the multipart form has reached an end of file (EOF) boundary. The mimetype of the file is '${mimeType}'.`
          )
          if (requestDropped) return
          const batchStartTime = Date.now()
          let objs = []

          const gzippedBuffer = Buffer.concat(buffer)
          if (gzippedBuffer.length > MAX_FILE_SIZE) {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(gzippedBuffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: Batch size too large ({batchSizeMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {batchElapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped)
              res
                .status(400)
                .send(
                  `File size too large (${gzippedBuffer.length} > ${MAX_FILE_SIZE})`
                )
            requestDropped = true
          }

          const gunzippedBuffer = zlib.gunzipSync(gzippedBuffer).toString()
          const gunzippedBufferMegabyteSize =
            estimateStringMegabyteSize(gunzippedBuffer)
          if (gunzippedBufferMegabyteSize > MAX_FILE_SIZE) {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: gunzippedBufferMegabyteSize,
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: batch size too large ({batchSizeMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {batchElapsedTimeMs}ms. Total objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped)
              res
                .status(400)
                .send(
                  `File size too large (${gunzippedBufferMegabyteSize} > ${MAX_FILE_SIZE})`
                )
            requestDropped = true
          }

          try {
            objs = JSON.parse(gunzippedBuffer)
          } catch {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: gunzippedBufferMegabyteSize,
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: Batch not in JSON format. Error occurred after {elapsedTimeMs}ms. This batch of objects took {batchElapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped) res.status(400).send('Failed to parse data.')
            requestDropped = true
          }

          // last = objs[objs.length - 1]
          totalObjectsProcessed += objs.length

          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = objectInsertionService({
            streamId: req.params.streamId,
            objects: objs,
            logger: req.log
          }).catch((e) => {
            req.log.error(
              {
                ...calculateLogMetadata({
                  batchSizeMb: gunzippedBufferMegabyteSize,
                  start,
                  batchStartTime,
                  totalObjectsProcessed
                }),
                objectCount: objs.length,
                err: e
              },
              `Upload error when inserting objects into database. Number of objects: {objectCount}. This batch took {batchElapsedTimeMs}ms. Error occurred after {elapsedTimeMs}ms. Total objects processed before error: {totalObjectsProcessed}.`
            )
            if (!requestDropped) {
              switch (e.constructor) {
                case ObjectHandlingError:
                  res
                    .status(400)
                    .send(`Error inserting object in the database: ${e.message}`)
                  break
                default:
                  res
                    .status(400)
                    .send(
                      'Error inserting object in the database. Check server logs for details'
                    )
              }
            }
            requestDropped = true
          })
          promises.push(promise)

          await promise

          req.log.info(
            {
              objectCount: objs.length,
              elapsedTimeMs: Date.now() - start,
              batchElapsedTimeMs: Date.now() - batchStartTime,
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
              uploadedSizeMB: toMegabytesWith1DecimalPlace(gunzippedBuffer.length),
              requestDropped,
              totalObjectsProcessed
            },
            'Uploaded batch of {objectCount} objects in {batchElapsedTimeMs}ms. Total objects processed so far: {totalObjectsProcessed} in a total of {elapsedTimeMs}ms.'
          )
        })
      } else if (
        mimeType === 'text/plain' ||
        mimeType === 'application/json' ||
        mimeType === 'application/octet-stream'
      ) {
        let buffer = ''
        file.on('data', (data) => {
          if (data) buffer += data
        })

        file.on('end', async () => {
          if (requestDropped) return
          const batchStartTime = Date.now()
          let objs = []

          if (buffer.length > MAX_FILE_SIZE) {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: Batch size too large ({batchSizeMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {batchElapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped)
              res
                .status(400)
                .send(`File size too large (${buffer.length} > ${MAX_FILE_SIZE})`)
            requestDropped = true
          }

          try {
            objs = JSON.parse(buffer)
          } catch {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: Batch not in JSON format. Error occurred after {elapsedTimeMs}ms. This batch failed after {batchElapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped)
              res.status(400).send('Failed to parse data. Batch is not in JSON format.')
            requestDropped = true
          }
          if (!Array.isArray(objs)) {
            req.log.error(
              calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              'Upload error: Batch not an array. Error occurred after {elapsedTimeMs}ms. This batch failed after {batchElapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}.'
            )
            if (!requestDropped)
              res
                .status(400)
                .send(
                  'Failed to parse data. Batch is expected to be wrapped in a JSON array.'
                )
            requestDropped = true
          }
          //FIXME should we exit here if requestDropped is true

          totalObjectsProcessed += objs.length
          req.log.debug(
            {
              ...calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              objectCount: objs.length
            },
            'Total objects, including current pending batch of {objectCount} objects, processed so far is {totalObjectsProcessed}. This batch has taken {batchElapsedTimeMs}ms. Total time elapsed is {elapsedTimeMs}ms.'
          )
          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = objectInsertionService({
            streamId: req.params.streamId,
            objects: objs,
            logger: req.log
          }).catch((e) => {
            req.log.error(
              {
                ...calculateLogMetadata({
                  batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                  start,
                  batchStartTime,
                  totalObjectsProcessed
                }),
                err: e
              },
              `Upload error when inserting objects into database. Number of objects: {objectCount}. This batch took {batchElapsedTimeMs}ms. Error occurred after {elapsedTimeMs}ms. Total objects processed before error: {totalObjectsProcessed}.`
            )
            if (!requestDropped)
              switch (e.constructor) {
                case ObjectHandlingError:
                  res
                    .status(400)
                    .send(`Error inserting object in the database. ${e.message}`)
                  break
                default:
                  res
                    .status(400)
                    .send(
                      'Error inserting object in the database. Check server logs for details'
                    )
              }
            requestDropped = true
          })
          promises.push(promise)

          await promise
          req.log.info(
            {
              ...calculateLogMetadata({
                batchSizeMb: estimateStringMegabyteSize(buffer),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              objectCount: objs.length,
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
            },
            'Uploaded batch of {objectCount} objects. Total number of objects processed is {totalObjectsProcessed}. This batch took {batchElapsedTimeMs}ms.'
          )
        })
      } else {
        req.log.info(
          {
            mimeType,
            totalObjectsProcessed
          },
          'Invalid ContentType header: {mimeType}. Total number of objects processed so far: {totalObjectsProcessed}.'
        )
        if (!requestDropped)
          res
            .status(400)
            .send(
              'Invalid ContentType header. This route only accepts "application/gzip", "text/plain" or "application/json".'
            )
        requestDropped = true
      }
    })

    busboy.on('finish', async () => {
      if (requestDropped) return

      req.log.info(
        {
          totalObjectsProcessed,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
          elapsedTimeMs: Date.now() - start
        },
        'Upload finished: {totalObjectsProcessed} objects processed in {elapsedTimeMs}ms'
      )

      let previouslyAwaitedPromises = 0
      while (previouslyAwaitedPromises !== promises.length) {
        previouslyAwaitedPromises = promises.length
        await Promise.all(promises)
      }

      res.status(201).end()
    })

    busboy.on('error', async (err) => {
      req.log.info(
        {
          err,
          totalObjectsProcessed,
          elapsedTimeMs: Date.now() - start,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
        },
        'Error during upload. Error occurred after {elapsedTimeMs}ms. Objects processed before error: {totalObjectsProcessed}. Error: {error}'
      )
      if (!requestDropped)
        res.status(400).end('Upload request error. The server logs have more details')
      requestDropped = true
    })

    req.pipe(busboy)
  })
}
