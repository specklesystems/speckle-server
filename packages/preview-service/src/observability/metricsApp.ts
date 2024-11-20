import { getDbClients } from '@/clients/knex.js'
import { loggingExpressMiddleware } from '@/observability/expressLogging.js'
import { metricsRouterFactory } from '@/observability/metricsRoute.js'
import { initPrometheusMetrics } from '@/observability/prometheusMetrics.js'
import { errorHandler } from '@/utils/errorHandler.js'
import express from 'express'
import createError from 'http-errors'

export const appFactory = async () => {
  const db = (await getDbClients()).main.public
  initPrometheusMetrics({ db })
  const app = express()

  app.use(loggingExpressMiddleware)
  app.use(express.json({ limit: '100mb' }))
  app.use(express.urlencoded({ limit: '100mb', extended: false }))

  app.use('/metrics', metricsRouterFactory())

  // catch 404 and forward to error handler
  app.use(function (req, _res, next) {
    next(createError(404, `Not Found: ${req.url}`))
  })
  app.set('json spaces', 2) // pretty print json

  app.use(errorHandler)
  return app
}
