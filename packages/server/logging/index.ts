/* istanbul ignore file */
import prometheusClient from 'prom-client'
import promBundle from 'express-prom-bundle'

import { initKnexPrometheusMetrics } from '@/logging/knexMonitoring'
import { initHighFrequencyMonitoring } from '@/logging/highFrequencyMetrics/highfrequencyMonitoring'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import { startupLogger as logger } from '@/logging/logging'
import type express from 'express'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'
import { handleMiddlewareErrors } from '@/modules/shared/middleware/middlewareWrapper'
import { PrometheusExpressMetricsError } from '@/modules/shared/errors/middleware'

let prometheusInitialized = false

export default async function (app: express.Express) {
  if (!prometheusInitialized) {
    prometheusInitialized = true
    prometheusClient.register.clear()
    prometheusClient.register.setDefaultLabels({
      project: 'speckle-server',
      app: 'server'
    })
    prometheusClient.collectDefaultMetrics()
    const highfrequencyMonitoring = initHighFrequencyMonitoring({
      register: prometheusClient.register,
      collectionPeriodMilliseconds: highFrequencyMetricsCollectionPeriodMs(),
      config: {
        getDbClients: getAllRegisteredDbClients
      }
    })
    highfrequencyMonitoring.start()

    await initKnexPrometheusMetrics({
      register: prometheusClient.register,
      getAllDbClients: getAllRegisteredDbClients,
      logger
    })

    app.use(
      handleMiddlewareErrors({
        handler: promBundle({
          includeMethod: true,
          includePath: true,
          httpDurationMetricName: 'speckle_server_request_duration',
          metricType: 'summary',
          autoregister: false
        }),
        verbPhraseForErrorMessage: 'gathering Express metrics',
        expectedErrorType: PrometheusExpressMetricsError
      })
    )
  }

  // Expose prometheus metrics at the `/metrics` endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.setHeader('Content-Type', prometheusClient.register.contentType)
      res.end(await prometheusClient.register.metrics())
    } catch (ex: unknown) {
      res.status(500).end(ex instanceof Error ? ex.message : `${ex}`)
    }
  })
}
