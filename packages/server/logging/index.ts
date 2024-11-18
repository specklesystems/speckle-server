/* istanbul ignore file */
import prometheusClient from 'prom-client'
import promBundle from 'express-prom-bundle'

import { initKnexPrometheusMetrics } from '@/logging/knexMonitoring'
import { initHighFrequencyMonitoring } from '@/logging/highFrequencyMetrics/highfrequencyMonitoring'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import { startupLogger as logger } from '@/logging/logging'
import type express from 'express'
import { getAllClients } from '@/modules/multiregion/dbSelector'

let prometheusInitialized = false

export default function (app: express.Express) {
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
        getDbClients: getAllClients
      }
    })
    highfrequencyMonitoring.start()

    initKnexPrometheusMetrics({
      register: prometheusClient.register,
      getAllDbClients: getAllClients,
      logger
    })
    const expressMetricsMiddleware = promBundle({
      includeMethod: true,
      includePath: true,
      httpDurationMetricName: 'speckle_server_request_duration',
      metricType: 'summary',
      autoregister: false
    })

    app.use(expressMetricsMiddleware)
  }
}
