import { corsMiddleware } from '@/modules/core/configs/cors'
import Busboy from 'busboy'
import { validatePermissionsWriteStream } from '@/modules/core/rest/authUtils'
import {
  getFeatureFlags,
  maximumObjectUploadFileSizeMb
} from '@/modules/shared/helpers/envHelper'
import {
  createObjectsBatched,
  createObjectsBatchedAndNoClosures
} from '@/modules/core/services/objects'
import { ObjectHandlingError } from '@/modules/core/errors/object'
import { toMegabytesWith1DecimalPlace } from '@/modules/core/utils/formatting'
import { Logger } from 'pino'
import { Router } from 'express'

const MAX_FILE_SIZE = maximumObjectUploadFileSizeMb() * 1024 * 1024
const { FF_NO_CLOSURE_WRITES } = getFeatureFlags()

let objectInsertionService: (params: {
  streamId: string
  objects: unknown[]
  logger?: Logger
}) => Promise<boolean | string[]> = createObjectsBatched
if (FF_NO_CLOSURE_WRITES) {
  objectInsertionService = createObjectsBatchedAndNoClosures
}

export default (app: Router) => {
  app.options('/objects/:streamId/v2', corsMiddleware())

  app.post('/objects/:streamId/v2', corsMiddleware(), async (req, res) => {
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

    let requestDropped = false
    const batchStartTime = Date.now()
    const objects: object[] = []
    let size = 0

    busboy.on('file', (_, file, info) => {
      const { mimeType } = info

      if (requestDropped) return

      if (mimeType === 'application/json') {
        let buffer = ''
        file.on('data', (data) => {
          if (data) buffer += data
        })

        file.on('end', async () => {
          if (requestDropped) return
          let obj = null
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
            obj = JSON.parse(buffer)
            size += buffer.length
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
          if (obj === null) {
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
          objects.push(obj)
          req.log.debug(
            {
              ...calculateLogMetadata({
                batchSizeMb: toMegabytesWith1DecimalPlace(buffer.length),
                start,
                batchStartTime,
                totalObjectsProcessed
              }),
              objectCount: buffer.length
            },
            'Total objects, including current pending batch of {objectCount} objects, processed so far is {totalObjectsProcessed}. This batch has taken {batchElapsedTimeMs}ms. Total time elapsed is {elapsedTimeMs}ms.'
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

      totalObjectsProcessed += 1
      const promise = objectInsertionService({
        streamId: req.params.streamId,
        objects,
        logger: req.log
      }).catch((e) => {
        req.log.error(
          {
            ...calculateLogMetadata({
              batchSizeMb: toMegabytesWith1DecimalPlace(size),
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

      await promise
      req.log.info(
        {
          ...calculateLogMetadata({
            batchSizeMb: toMegabytesWith1DecimalPlace(size),
            start,
            batchStartTime,
            totalObjectsProcessed
          }),
          objectCount: 1,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
        },
        'Uploaded batch of {objectCount} objects. Total number of objects processed is {totalObjectsProcessed}. This batch took {batchElapsedTimeMs}ms.'
      )

      req.log.info(
        {
          totalObjectsProcessed,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
          elapsedTimeMs: Date.now() - start
        },
        'Upload finished: {totalObjectsProcessed} objects processed in {elapsedTimeMs}ms'
      )
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
