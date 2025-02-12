/* istanbul ignore file */
import type { Nullable } from '@speckle/shared'
import prometheusClient from 'prom-client'
import type express from 'express'
import { BaseError } from '@/modules/shared/errors'
import { logger as defaultLogger } from '@/logging/logging'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let metricErrorCount: Nullable<prometheusClient.Counter<any>> = null

export const errorMetricsMiddleware: express.ErrorRequestHandler = (
  err,
  req,
  res,
  next
) => {
  if (!err) {
    return next()
  }

  const logger = req.log || defaultLogger
  if (metricErrorCount === null) {
    metricErrorCount = new prometheusClient.Counter({
      name: 'speckle_server_request_errors',
      help: 'Number of requests that threw exceptions',
      labelNames: ['route']
    })
  }

  if (
    !(err instanceof BaseError) &&
    !(
      typeof err === 'object' &&
      'statusCode' in err &&
      typeof err.statusCode === 'number' &&
      err.statusCode >= 400 &&
      err.statusCode < 600
    ) &&
    !(
      typeof err === 'object' &&
      'code' in err &&
      typeof err.code === 'number' &&
      err.code >= 400 &&
      err.code < 600
    )
  ) {
    logger.error(
      { err },
      `Unexpected type of error when handling ${req.originalUrl} from ${req.ip}. Please raise a bug report to the developers.`
    )
  }

  let route = 'unknown'
  if (req.route && req.route.path) route = req.route.path //FIXME this should be the route template, not the actual route.
  metricErrorCount.labels(route).inc()
  next(err)
}
