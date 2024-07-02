import express, { ErrorRequestHandler } from 'express'
import createError from 'http-errors'
import { loggingExpressMiddleware } from '@/observability/expressLogging'
import { metricsRouterFactory } from '@/observability/metricsRoute'
import { initPrometheusMetrics } from '@/observability/prometheusMetrics'
import type { Knex } from 'knex'
import { errorHandler } from '@/utils/errorHandler'

export const appFactory = (deps: { db: Knex }) => {
  const { db } = deps
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
