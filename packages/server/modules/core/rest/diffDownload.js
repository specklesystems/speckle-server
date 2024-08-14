'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')

const { validatePermissionsReadStream } = require('./authUtils')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { getObjectsStream } = require('../services/objects')

const { pipeline, PassThrough } = require('stream')

module.exports = (app) => {
  app.options('/api/getobjects/:streamId', corsMiddleware())

  app.post('/api/getobjects/:streamId', corsMiddleware(), async (req, res) => {
    req.log = req.log.child({
      userId: req.context.userId || '-',
      streamId: req.params.streamId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const childrenList = JSON.parse(req.body.objects)
    const simpleText = req.headers.accept === 'text/plain'

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    // "output" stream, connected to res with `pipeline` (auto-closing res)
    const speckleObjStream = new SpeckleObjectsStream(simpleText)
    const gzipStream = zlib.createGzip()

    pipeline(
      speckleObjStream,
      gzipStream,
      new PassThrough({ highWaterMark: 16384 * 31 }),
      res,
      (err) => {
        if (err) {
          req.log.error(err, `App error streaming objects`)
        } else {
          req.log.info(
            {
              childCount: childrenList.length,
              mbWritten: gzipStream.bytesWritten / 1000000
            },
            'Streamed {childCount} objects (size: {mbWritten} MB)'
          )
        }
      }
    )

    const databaseStreams = []
    const cSize = 2
    let iterationIndex = 0
    try {
      for (let cStart = 0; cStart < childrenList.length; cStart += cSize) {
        const childrenChunk = childrenList.slice(cStart, cStart + cSize)

        req.log.info({iterationIndex}, 'Opening db stream on iteration {iterationIndex}')
        const dbStream = await getObjectsStream({
          streamId: req.params.streamId,
          objectIds: childrenChunk
        })
        databaseStreams.push(dbStream)

        speckleObjStream.on('error', (err) => {
          req.log.error(
            { err, iterationIndex },
            'Stream error streaming objects on iteration {iterationIndex}'
          )
        })
        speckleObjStream.on('end', (err) => {
          req.log.info(
            { err, iterationIndex },
            'Stream ended on iteration {iterationIndex}'
          )
        })
        speckleObjStream.on('close', (err) => {
          req.log.info(
            { err, iterationIndex },
            'Stream closed on iteration {iterationIndex}'
          )
        })

        const numReadableDbStreams = databaseStreams.filter((s) => s.readable).length
        req.log.info(
          { numReadableDbStreams, iterationIndex },
          'Number of readable db streams {numReadableDbStreams} at iteration {iterationIndex}'
        )

        iterationIndex++
        await new Promise((resolve, reject) => {
          dbStream.pipe(speckleObjStream, { end: false })
          dbStream.once('data', (data) => {
            //HACK force premature close of connection after first iteration
            if (iterationIndex === 1) res.end()
            req.log.debug({id: data.id }, 'DB stream data on iteration {iterationIndex} return {id}')
          })
          dbStream.once('end', (params) => {
            req.log.info(
              { iterationIndex: iterationIndex - 1 },
              'DB stream ended on iteration {iterationIndex}'
            )
            resolve(params)
          })
          dbStream.once('close', (params) => {
            req.log.info(
              { iterationIndex: iterationIndex - 1 },
              'DB stream closed on iteration {iterationIndex}'
            )
            return resolve(params)
          })
          dbStream.once('error', (params) => {
            req.log.error(
              { iterationIndex: iterationIndex - 1 },
              'DB stream error on iteration {iterationIndex}'
            )
            return reject(params)
          })
        })
      }
    } catch (ex) {
      req.log.error(ex, `DB Error streaming objects`)
      speckleObjStream.emit('error', new Error('Database streaming error'))
    } finally {
      req.log.warn({iterationIndex}, 'Finally block reached')
    }

    const numReadableDbStreamsBefore = databaseStreams.filter((s) => s.readable).length
    req.log.warn(
      { numReadableDbStreams: numReadableDbStreamsBefore, iterationIndex },
      'Number of readable db streams {numReadableDbStreams} before ending speckle object stream'
    )
    speckleObjStream.end()

    const numReadableDbStreamsAfter = databaseStreams.filter((s) => s.readable).length
    req.log.warn(
      { numReadableDbStreams: numReadableDbStreamsAfter, iterationIndex },
      'Number of readable db streams {numReadableDbStreams} after ending speckle object stream'
    )
  })
}
