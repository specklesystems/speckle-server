/* istanbul ignore file */
import { logger } from '@/logging/logging'
import type { Nullable } from '@speckle/shared'
import prometheusClient from 'prom-client'
import type express from 'express'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metricErrorCount: Nullable<prometheusClient.Counter<any>> = null

export const errorLoggingMiddleware: express.ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (metricErrorCount === null) {
    metricErrorCount = new prometheusClient.Counter({
      name: 'speckle_server_request_errors',
      help: 'Number of requests that threw exceptions',
      labelNames: ['route']
    })
  }

  if (!('statusCode' in err) || err.statusCode >= 500) {
    logger.error({ err }, `Error when handling ${req.originalUrl} from ${req.ip}`)
  } else if (err.statusCode >= 400) {
    logger.info({ err }, `Error when handling ${req.originalUrl} from ${req.ip}`)
  } else {
    logger.warn(
      { err },
      `Error when handling ${req.originalUrl} from ${req.ip}. Error has a statusCode but it is not 4xx or 5xx.`
    )
  }

  let route = 'unknown'
  if (req.route && req.route.path) route = req.route.path
  metricErrorCount.labels(route).inc()
  next(err)
}
