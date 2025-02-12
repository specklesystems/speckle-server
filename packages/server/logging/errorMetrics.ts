/* istanbul ignore file */
import type { Nullable } from '@speckle/shared'
import prometheusClient from 'prom-client'
import type express from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metricErrorCount: Nullable<prometheusClient.Counter<any>> = null

export const errorMetricsMiddleware: express.ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (!err) {
    return next(err)
  }

  if (metricErrorCount === null) {
    metricErrorCount = new prometheusClient.Counter({
      name: 'speckle_server_request_errors',
      help: 'Number of requests that threw exceptions',
      labelNames: ['route']
    })
  }

  let route = 'unknown'
  if (req.route && req.route.path) route = req.route.path //FIXME this should be the route template, not the actual route.
  metricErrorCount.labels(route).inc()
  next(err)
}
