'use strict'
const zlib = require('zlib')

const { corsMiddleware } = require('@/modules/core/configs/cors')
const Busboy = require('busboy')

const { validatePermissionsWriteStream } = require('./authUtils')

const { createObjectsBatched } = require('@/modules/core/services/objects')
const { ObjectHandlingError } = require('@/modules/core/errors/object')
const { estimateStringMegabyteSize } = require('@/modules/core/utils/chunking')

const {
  getDbPipeline,
  getTestPipeline
} = require('@/modules/core/services/custom-stream')

const MAX_FILE_SIZE = 500 * 1024 * 1024 // env var?
const allowedMimeTypes = [
  'application/gzip',
  'text/plain',
  'application/json',
  'application/octet-stream'
]

module.exports = (app) => {
  // V4 - patched .net client, pipeline'd server architecture, no more closures
  // V4: Finished sending 11944 objects after 13.7292366s.
  // V4: Finished sending 11944 objects after 13.6377732s.
  // V4: Finished sending 11944 objects after 15.4552502s.
  // V4: Finished sending 23882 objects after 27.6380942s.

  // V4: Finished sending 23882 objects after 33.3323251s.
  // V4: Finished sending 23882 objects after 27.6585795s.
  app.options('/objects/v4/:projectId', corsMiddleware())
  app.post('/objects/v4/:projectId', corsMiddleware(), async (req, res) => {
    console.log(`
    
    V4 - patched .net client, pipeline'd server architecture
    
    `)
    const busboy = Busboy({ headers: req.headers })

    let t0 = 0

    busboy.on('file', (name, file, info) => {
      const pipe = getTestPipeline(req.params.projectId)

      t0 = performance.now()
      file
        .pipe(pipe)
        .on('error', (err) => console.log(err))
        .on('end', () => {
          const duration = (performance.now() - t0) / 1000
          // const fileEndVsEnd = (performance.now() - f0) / 1000
          req.log.info(`Finished processing objects in ${duration}s.`)
          res.status(201).send('ok')
        })
    })
    req.pipe(busboy)
  })

  // V3 - existing .net client, pipeline'd server architecture, no more closures
  // V3: Finished sending 1844 objects after 8.4055994s.
  // V3: Finished sending 1844 objects after 8.4579102s.
  // V3: Finished sending 1844 objects after 10.173536s.
  // V3: Finished sending 3682 objects after 16.7458571s.

  // V3: Finished sending 23882 objects after 30.0713102s.
  // V3: Finished sending 23882 objects after 29.2390551s.

  app.options('/objects/v3/:streamId', corsMiddleware())
  app.post('/objects/v3/:streamId', corsMiddleware(), async (req, res) => {
    console.log(`
    
    V3 - existing .net client, pipeline'd server architecture
    
    `)
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

    const handleError = (err) => {
      req.log.error(err)
      return res.status(400).send(err)
    }

    let busboy
    try {
      busboy = Busboy({ headers: req.headers })
    } catch (e) {
      handleError(
        new Error(
          'Failed to parse request headers and body content as valid multipart/form-data.'
        )
      )
    }

    let t0 = 0
    let f0 = 0

    busboy.on('file', (name, file, info) => {
      const { mimeType } = info

      if (!allowedMimeTypes.includes(mimeType)) {
        handleError(
          new Error(
            `Invalid ContentType header "${mimeType}". This route only accepts "application/gzip", "text/plain" or "application/json".`
          )
        )
      }

      const pipeline = getDbPipeline(
        req.params.streamId,
        mimeType === 'application/gzip',
        true
      )

      t0 = performance.now()
      let bytes = 0
      file
        .pipe(pipeline)
        .on('data', (data) => {
          bytes += data.length
          if (bytes > MAX_FILE_SIZE) {
            // TODO: throw error and terminate req
          }
        })
        .on('error', (err) => handleError(err))
        .on('end', () => {
          const duration = (performance.now() - t0) / 1000
          const fileEndVsEnd = (performance.now() - f0) / 1000
          req.log.info(
            `Finished processing objects in ${duration}s. Delta file upload end vs. processing end ${fileEndVsEnd}s.`
          )
          res.status(201).end()
        })
    })

    busboy.on('finish', async () => {
      f0 = performance.now()
      req.log.info(
        `file finished uploading in ${
          (performance.now() - t0) / 1000
        }s. processing still ongoing.`
      )
    })

    busboy.on('error', handleError)

    req.pipe(busboy)
  })

  // V2 - existing .net client, existing server architecture, no more closures
  // V2: Finished sending 6220 objects after 10.415615s.
  // V2: Finished sending 5949 objects after 9.5852275s.
  // V2: Finished sending 6113 objects after 10.824452s.
  // V2: Finished sending 12214 objects after 19.6617508s.

  // V2: Finished sending 23882 objects after 20.4832349s.
  // V2: Finished sending 23882 objects after 18.0330272s.
  app.options('/objects/v2/:streamId', corsMiddleware())
  app.post('/objects/v2/:streamId', corsMiddleware(), async (req, res) => {
    console.log(`
    
    V2 - existing .net client, existing server architecture
    
    `)
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
              `Upload error: Batch size too large (${gzippedBuffer.length} > ${MAX_FILE_SIZE})`
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
              `upload error: batch size too large (${gunzippedBufferMegabyteSize} > ${MAX_FILE_SIZE})`
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
          } catch (e) {
            req.log.error(`Upload error: Batch not in JSON format`)
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

          const promise = createObjectsBatched(req.params.streamId, objs).catch((e) => {
            req.log.error(e, `Upload error.`)
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
              durationSeconds: (Date.now() - t0) / 1000,
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
              uploadedSizeMB: gunzippedBuffer.length / 1000000,
              requestDropped
            },
            `Uploaded batch of ${objs.length} objects`
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
              `Upload error: Batch size too large (${buffer.length} > ${MAX_FILE_SIZE})`
            )
            if (!requestDropped)
              res
                .status(400)
                .send(`File size too large (${buffer.length} > ${MAX_FILE_SIZE})`)
            requestDropped = true
          }

          try {
            objs = JSON.parse(buffer)
          } catch (e) {
            req.log.error(`Upload error: Batch not in JSON format`)
            if (!requestDropped)
              res.status(400).send('Failed to parse data. Batch is not in JSON format.')
            requestDropped = true
          }
          if (!Array.isArray(objs)) {
            req.log.error(`Upload error: Batch not an array`)
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
            `total objects, including current pending batch, processed so far is ${totalProcessed}`
          )
          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = createObjectsBatched(req.params.streamId, objs).catch((e) => {
            req.log.error(e, `Upload error.`)
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
              uploadedSizeMB: estimateStringMegabyteSize(buffer),
              durationSeconds: (Date.now() - t0) / 1000,
              crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
              requestDropped
            },
            `Uploaded batch of ${objs.length} objects.`
          )
        })
      } else {
        req.log.info(`Invalid ContentType header: ${mimeType}`)
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
          crtMemUsageMB: process.memoryUsage().heapUsed / 1024 / 1024
        },
        `Upload finished: ${totalProcessed} objs`
      )

      let previouslyAwaitedPromises = 0
      while (previouslyAwaitedPromises !== promises.length) {
        previouslyAwaitedPromises = promises.length
        await Promise.all(promises)
      }

      res.status(201).end()
    })

    busboy.on('error', async (err) => {
      req.log.info(`Upload error: ${err}`)
      if (!requestDropped)
        res.status(400).end('Upload request error. The server logs have more details')
      requestDropped = true
    })

    req.pipe(busboy)
  })
}
