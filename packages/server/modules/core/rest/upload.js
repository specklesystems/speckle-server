'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')
const Busboy = require('busboy')

const { validatePermissionsWriteStream } = require('./authUtils')
const { getFeatureFlags } = require('@/modules/shared/helpers/envHelper')
const {
  createObjectsBatched,
  createObjectsBatchedAndNoClosures
} = require('@/modules/core/services/objects')
const { ObjectHandlingError } = require('@/modules/core/errors/object')
const { estimateStringMegabyteSize } = require('@/modules/core/utils/chunking')

const MAX_FILE_SIZE = 50 * 1024 * 1024
const { FF_NO_CLOSURE_WRITES } = getFeatureFlags()

let objectInsertionService = createObjectsBatched
if (FF_NO_CLOSURE_WRITES) {
  objectInsertionService = createObjectsBatchedAndNoClosures
}

module.exports = (app) => {
  app.options('/objects/:streamId', corsMiddleware())

  app.post('/objects/:streamId', corsMiddleware(), async (req, res) => {
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
    let totalProcessed = 0
    // let last = {}

    const promises = []
    let requestDropped = false

    busboy.on('file', (name, file, info) => {
      const { mimeType } = info

      if (requestDropped) return

      if (mimeType === 'application/gzip') {
        const buffer = []

        file.on('data', (data) => {
          if (data) buffer.push(data)
        })

        file.on('end', async () => {
          req.log.info(
            `File upload of the multipart form has reached an end of file (EOF) boundary. The mimetype of the file is '${mimeType}'.`
          )
          if (requestDropped) return
          const t0 = Date.now()
          let objs = []

          const gzippedBuffer = Buffer.concat(buffer)
          if (gzippedBuffer.length > MAX_FILE_SIZE) {
            req.log.error(
              {
                bufferLengthMb: gzippedBuffer.length,
                maxFileSizeMb: MAX_FILE_SIZE,
                elapsedTimeMs: Date.now() - start,
                objectBatchElapsedTimeMs: Date.now() - t0,
                totalProcessed
              },
              'Upload error: Batch size too large ({bufferLengthMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {objectBatchElapsedTimeMs}ms. Objects processed before error: {totalProcessed}.'
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
              {
                bufferLengthMb: gunzippedBufferMegabyteSize,
                maxFileSizeMb: MAX_FILE_SIZE,
                elapsedTimeMs: Date.now() - start,
                objectBatchElapsedTimeMs: Date.now() - t0,
                totalProcessed
              },
              'Upload error: batch size too large ({bufferLengthMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {objectBatchElapsedTimeMs}ms. Total objects processed before error: {totalProcessed}.'
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
              {
                elapsedTimeMs: Date.now() - start,
                objectBatchElapsedTimeMs: Date.now() - t0,
                totalProcessed
              },
              'Upload error: Batch not in JSON format. Error occurred after {elapsedTimeMs}ms. This batch of objects took {objectBatchElapsedTimeMs}ms. Objects processed before error: {totalProcessed}.'
            )
            if (!requestDropped) res.status(400).send('Failed to parse data.')
            requestDropped = true
          }

          // last = objs[objs.length - 1]
          totalProcessed += objs.length

          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = objectInsertionService(req.params.streamId, objs).catch(
            (e) => {
              req.log.error(
                {
                  elapsedTimeMs: Date.now() - start,
                  objectCount: objs.length,
                  objectBatchElapsedTimeMs: Date.now() - t0,
                  totalProcessed,
                  error: e
                },
                `Upload error when inserting objects into database. Number of objects: {objectCount}. This batch took {objectBatchElapsedTimeMs}ms. Error occurred after {elapsedTimeMs}ms. Total objects processed before error: {totalProcessed}.`
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
            }
          )
          promises.push(promise)

          await promise

          req.log.info(
            {
              objectCount: objs.length,
              elapsedTimeMs: Date.now() - start,
              objectBatchElapsedTimeMs: Date.now() - t0,
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
              uploadedSizeMB: gunzippedBuffer.length / 1000000,
              requestDropped,
              totalProcessed
            },
            'Uploaded batch of {objectCount} objects in {objectBatchElapsedTimeMs}ms. Total objects processed so far: {totalProcessed} in a total of {elapsedTimeMs}ms.'
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
          const t0 = Date.now()
          let objs = []

          if (buffer.length > MAX_FILE_SIZE) {
            req.log.error(
              {
                bufferLengthMb: buffer.length,
                maxFileSizeMb: MAX_FILE_SIZE,
                objectBatchElapsedTimeMs: Date.now() - t0,
                elapsedTimeMs: Date.now() - start,
                totalProcessed
              },
              'Upload error: Batch size too large ({bufferLengthMb} > {maxFileSizeMb}). Error occurred after {elapsedTimeMs}ms. This batch took {objectBatchElapsedTimeMs}ms. Objects processed before error: {totalProcessed}.'
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
              {
                objectBatchElapsedTimeMs: Date.now() - t0,
                elapsedTimeMs: Date.now() - start,
                totalProcessed
              },
              'Upload error: Batch not in JSON format. Error occurred after {elapsedTimeMs}ms. This batch failed after {objectBatchElapsedTimeMs}ms. Objects processed before error: {totalProcessed}.'
            )
            if (!requestDropped)
              res.status(400).send('Failed to parse data. Batch is not in JSON format.')
            requestDropped = true
          }
          if (!Array.isArray(objs)) {
            req.log.error(
              {
                objectBatchElapsedTimeMs: Date.now() - t0,
                elapsedTimeMs: Date.now() - start,
                totalProcessed
              },
              'Upload error: Batch not an array. Error occurred after {elapsedTimeMs}ms. This batch failed after {objectBatchElapsedTimeMs}ms. Objects processed before error: {totalProcessed}.'
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

          totalProcessed += objs.length
          req.log.debug(
            {
              objectCount: objs.length,
              objectBatchElapsedTimeMs: Date.now() - t0,
              elapsedTimeMs: Date.now() - start,
              totalProcessed
            },
            'Total objects, including current pending batch of {objectCount} objects, processed so far is {totalProcessed}. This batch has taken {objectBatchElapsedTimeMs}ms. Total time elapsed is {elapsedTimeMs}ms.'
          )
          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = objectInsertionService(req.params.streamId, objs).catch(
            (e) => {
              req.log.error(
                {
                  elapsedTimeMs: Date.now() - start,
                  objectCount: objs.length,
                  objectBatchElapsedTimeMs: Date.now() - t0,
                  totalProcessed,
                  error: e
                },
                `Upload error when inserting objects into database. Number of objects: {objectCount}. This batch took {objectBatchElapsedTimeMs}ms. Error occurred after {elapsedTimeMs}ms. Total objects processed before error: {totalProcessed}.`
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
            }
          )
          promises.push(promise)

          await promise
          req.log.info(
            {
              objectCount: objs.length,
              objectBatchElapsedTimeMs: Date.now() - t0,
              uploadedSizeMB: estimateStringMegabyteSize(buffer),
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
              totalProcessed
            },
            'Uploaded batch of {objectCount} objects. Total processed is {totalProcessed} objects. This batch took {objectBatchElapsedTimeMs}ms.'
          )
        })
      } else {
        req.log.info(
          {
            mimeType,
            totalProcessed
          },
          'Invalid ContentType header: {mimeType}. Total objects processed so far: {totalProcessed}.'
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
          totalProcessed,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
          elapsedTimeMs: Date.now() - start
        },
        'Upload finished: {totalProcessed} objects in {elapsed}ms'
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
          error: err,
          totalProcessed,
          elapsedTimeMs: Date.now() - start,
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
        },
        'Error during upload. Error occurred after {elpasedTimeMs}ms. Objects processed before error: {totalProcessed}. Error: {error}'
      )
      if (!requestDropped)
        res.status(400).end('Upload request error. The server logs have more details')
      requestDropped = true
    })

    req.pipe(busboy)
  })
}
