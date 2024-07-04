import { loggingExpressMiddleware } from '#src/observability/expressLogging.js'
import apiRouterFactory from '#src/server/routes/api.js'
import indexRouterFactory from '#src/server/routes/index.js'
import objectsRouterFactory from '#src/server/routes/objects.js'
import previewRouterFactory from '#src/server/routes/preview.js'
import { errorHandler } from '#src/utils/errorHandler.js'
import express from 'express'
import createError from 'http-errors'
import type { Knex } from 'knex'

export const appFactory = (deps: { db: Knex }) => {
  const { db } = deps
  const app = express()

  app.use(loggingExpressMiddleware)

  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))
  //webpack will build the renderPage and save it to the packages/preview-service/dist/public directory
  app.use(express.static('../public'))

  app.use('/', indexRouterFactory())
  app.use('/preview', previewRouterFactory())
  app.use('/objects', objectsRouterFactory({ db }))
  app.use('/api', apiRouterFactory({ db }))

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404, `Not Found: ${req.url}`))
  })

  app.set('json spaces', 2) // pretty print json
  app.use(errorHandler)
  return app
}
