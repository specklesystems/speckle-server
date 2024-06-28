'use strict'

import createError from 'http-errors'
import express, { ErrorRequestHandler } from 'express'
import path from 'path'

import indexRouterFactory from './routes/index'
import previewRouterFactory from './routes/preview'
import objectsRouterFactory from './routes/objects'
import apiRouterFactory from './routes/api'
import { loggingExpressMiddleware } from '../observability/expressLogging'
import type { Knex } from 'knex'

export const appFactory = (deps: { db: Knex }) => {
  const { db } = deps
  const app = express()

  app.use(loggingExpressMiddleware)

  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))
  //webpack will build the renderPage and save it to the packages/preview-service/dist/public directory
  app.use(express.static(path.join(__dirname, '../public')))

  app.use('/', indexRouterFactory())
  app.use('/preview', previewRouterFactory())
  app.use('/objects', objectsRouterFactory({ db }))
  app.use('/api', apiRouterFactory({ db }))

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404, `Not Found: ${req.url}`))
  })

  const errorHandler: ErrorRequestHandler = (err, req, res) => {
    let errorText = err.message
    if (req.app.get('env') === 'development') {
      errorText = `<html><body><pre>${err.message}: ${err.status}\n${err.stack}</pre></body></html>`
    }
    res.status(err.status || 500)
    res.send(errorText)
  }

  app.use(errorHandler)
  return app
}
