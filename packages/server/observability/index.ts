/* istanbul ignore file */
import prometheusClient, { Registry } from 'prom-client'
import promBundle from 'express-prom-bundle'

import { initKnexPrometheusMetrics } from '@/observability/components/knex/knexMonitoring'
import { initHighFrequencyMonitoring } from '@/observability/components/highFrequencyMetrics/highfrequencyMonitoring'
import { highFrequencyMetricsCollectionPeriodMs } from '@/modules/shared/helpers/envHelper'
import { startupLogger as logger } from '@/observability/logging'
import type express from 'express'
import { getAllRegisteredDbClients } from '@/modules/multiregion/utils/dbSelector'

let prometheusInitialized = false
let prometheusRegistryInitialized = false

/**
 * This has to be called prior to using Prometheus
 * @returns The registry of Prometheus metrics which will be served
 */
export function initPrometheusRegistry() {
  if (!prometheusRegistryInitialized) {
    prometheusRegistryInitialized = true
    prometheusClient.register.clear()
    prometheusClient.register.setDefaultLabels({
      project: 'speckle-server',
      app: 'server'
    })
  }

  return prometheusClient.register
}

export default async function (params: { app: express.Express; registry: Registry }) {
  const { app, registry } = params
  if (!prometheusInitialized) {
    prometheusInitialized = true
    prometheusClient.collectDefaultMetrics({
      register: registry
    })
    const highfrequencyMonitoring = initHighFrequencyMonitoring({
      registers: [registry],
      collectionPeriodMilliseconds: highFrequencyMetricsCollectionPeriodMs(),
      config: {
        getDbClients: getAllRegisteredDbClients
      }
    })
    highfrequencyMonitoring.start()

    await initKnexPrometheusMetrics({
      registers: [registry],
      getAllDbClients: getAllRegisteredDbClients,
      logger
    })

    app.use(
      promBundle({
        includeMethod: true,
        includePath: true,
        httpDurationMetricName: 'speckle_server_request_duration',
        metricType: 'summary',
        autoregister: false
      })
    )
  }

  // Expose prometheus metrics
  app.get('/metrics', async (req, res, next) => {
    try {
      res.set('Content-Type', registry.contentType)
      res.end(await registry.metrics())
    } catch (ex: unknown) {
      res.status(500).end(ex instanceof Error ? ex.message : `${ex}`)
      next(ex)
    }
  })
}
