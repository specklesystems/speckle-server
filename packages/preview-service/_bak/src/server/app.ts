import { loggingExpressMiddleware } from '@/observability/expressLogging.js'
import { srcRoot } from '@/root.js'
import apiRouterFactory from '@/server/routes/api.js'
import indexRouterFactory from '@/server/routes/index.js'
import objectsRouterFactory from '@/server/routes/objects.js'
import previewRouterFactory from '@/server/routes/preview.js'
import { errorHandler } from '@/utils/errorHandler.js'
import express from 'express'
import createError from 'http-errors'
import path from 'path'

export const appFactory = () => {
  const app = express()

  app.use(loggingExpressMiddleware)

  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))
  //webpack will build the renderPage and save it to the packages/preview-service/dist/public directory
  app.use(express.static(path.join(srcRoot, '../public')))

  app.use('/', indexRouterFactory())
  app.use('/preview', previewRouterFactory())
  app.use('/objects', objectsRouterFactory())
  app.use('/api', apiRouterFactory())

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404, `Not Found: ${req.url}`))
  })

  app.set('json spaces', 2) // pretty print json
  app.use(errorHandler)
  return app
}
