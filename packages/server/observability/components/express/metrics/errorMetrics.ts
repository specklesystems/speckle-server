/* istanbul ignore file */
import type { Nullable } from '@speckle/shared'
import { Counter, type Registry } from 'prom-client'
import type { ErrorRequestHandler } from 'express'

let metricErrorCount: Nullable<Counter<'route'>> = null

export const errorMetricsMiddlewareFactory: (params: {
  promRegisters: Registry[]
}) => ErrorRequestHandler = (params) => (err, req, res, next) => {
  if (metricErrorCount === null) {
    params.promRegisters.forEach((register) => {
      register.removeSingleMetric('speckle_server_request_errors')
    })
    metricErrorCount = new Counter({
      name: 'speckle_server_request_errors',
      help: 'Number of requests that threw exceptions',
      labelNames: ['route'],
      registers: params.promRegisters
    })
  }

  let route = 'unknown'
  if (req.route && req.route.path) route = req.route.path
  metricErrorCount.labels(route).inc()
  next(err)
}
