'use strict'
const zlib = require('zlib')
const { corsMiddleware } = require('@/modules/core/configs/cors')

const { validatePermissionsReadStream } = require('./authUtils')

const { getObject, getObjectChildrenStream } = require('../services/objects')
const { SpeckleObjectsStream } = require('./speckleObjectsStream')
const { pipeline, PassThrough } = require('stream')
const { logger } = require('@/logging/logging')
const { HttpMethod } = require('@/modules/shared/helpers/typeHelper')
module.exports = ({ app, openApiDocument }) => {
  app.options('/objects/:streamId/:objectId', corsMiddleware())
  openApiDocument.registerOperation(
    '/objects/{streamId}/{objectId}',
    HttpMethod.OPTIONS,
    {
      description: 'Options for downloading an object from a project (stream)',
      responses: {
        200: {
          description: 'Options were retrieved.'
        }
      }
    }
  )

  app.get('/objects/:streamId/:objectId', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    // Populate first object (the "commit")
    const obj = await getObject({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })

    if (!obj) {
      return res.status(404).send('Failed to find object.')
    }

    const simpleText = req.headers.accept === 'text/plain'

    res.writeHead(200, {
      'Content-Encoding': 'gzip',
      'Content-Type': simpleText ? 'text/plain; charset=UTF-8' : 'application/json'
    })

    const dbStream = await getObjectChildrenStream({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const speckleObjStream = new SpeckleObjectsStream(simpleText)
    const gzipStream = zlib.createGzip()

    speckleObjStream.write(obj)

    pipeline(
      dbStream,
      speckleObjStream,
      gzipStream,
      new PassThrough({ highWaterMark: 16384 * 31 }),
      res,
      (err) => {
        if (err) {
          boundLogger.error(err, 'Error downloading object.')
        } else {
          boundLogger.info(
            `Downloaded object (size: ${gzipStream.bytesWritten / 1000000} MB)`
          )
        }
      }
    )
  })
  openApiDocument.registerOperation('/objects/{streamId}/{objectId}', HttpMethod.GET, {
    description: 'Download objects from a project (stream)',
    parameters: [
      {
        in: 'path',
        name: 'streamId',
        required: true,
        schema: {
          type: 'string'
        }
      },
      {
        in: 'path',
        name: 'objectId',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ],
    responses: {
      200: {
        description: 'Objects were downloaded.'
      }
    }
  })

  app.options('/objects/:streamId/:objectId/single', corsMiddleware())
  openApiDocument.registerOperation(
    '/objects/{streamId}/{objectId}/single',
    HttpMethod.OPTIONS,
    {
      description: 'Options for downloading a single object from a project (stream)',
      parameters: [
        {
          in: 'path',
          name: 'streamId',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Options were retrieved.'
        }
      }
    }
  )

  app.get('/objects/:streamId/:objectId/single', corsMiddleware(), async (req, res) => {
    const boundLogger = (req.log || logger).child({
      requestId: req.id,
      userId: req.context.userId || '-',
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })
    const hasStreamAccess = await validatePermissionsReadStream(
      req.params.streamId,
      req
    )
    if (!hasStreamAccess.result) {
      return res.status(hasStreamAccess.status).end()
    }

    const obj = await getObject({
      streamId: req.params.streamId,
      objectId: req.params.objectId
    })

    if (!obj) {
      boundLogger.warn('Failed to find object.')
      return res.status(404).send('Failed to find object.')
    }

    boundLogger.info('Downloaded single object.')

    res.send(obj.data)
  })
  openApiDocument.registerOperation(
    '/objects/{streamId}/{objectId}/single',
    HttpMethod.GET,
    {
      description: 'Options for downloading a single object from a project (stream)',
      parameters: [
        {
          in: 'path',
          name: 'streamId',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          in: 'path',
          name: 'objectId',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'An object was retrieved.'
        }
      }
    }
  )
}
