'use strict'
const zlib = require('zlib')
const cors = require('cors')
const Busboy = require('busboy')

const { validatePermissionsWriteStream } = require('./authUtils')

const { createObjectsBatched } = require('../services/objects')

const MAX_FILE_SIZE = 50 * 1024 * 1024

module.exports = (app) => {
  app.options('/objects/:streamId', cors())

  app.post('/objects/:streamId', cors(), async (req, res) => {
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

    const busboy = Busboy({ headers: req.headers })
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
          if (gunzippedBuffer.length > MAX_FILE_SIZE) {
            req.log.error(
              `Upload error: Batch size too large (${gunzippedBuffer.length} > ${MAX_FILE_SIZE})`
            )
            if (!requestDropped)
              res
                .status(400)
                .send(
                  `File size too large (${gunzippedBuffer.length} > ${MAX_FILE_SIZE})`
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
            if (!requestDropped)
              res
                .status(400)
                .send(
                  'Error inserting object in the database. Check server logs for details'
                )
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
            if (!requestDropped) res.status(400).send('Failed to parse data.')
            requestDropped = true
          }

          totalProcessed += objs.length

          let previouslyAwaitedPromises = 0
          while (previouslyAwaitedPromises !== promises.length) {
            previouslyAwaitedPromises = promises.length
            await Promise.all(promises)
          }

          const promise = createObjectsBatched(req.params.streamId, objs).catch((e) => {
            req.log.error(e, `Upload error.`)
            if (!requestDropped)
              res
                .status(400)
                .send(
                  'Error inserting object in the database. Check server logs for details'
                )
            requestDropped = true
          })
          promises.push(promise)

          await promise
          req.log.info(
            {
              uploadedSizeMB: buffer.length / 1000000,
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
