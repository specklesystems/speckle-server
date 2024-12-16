import { DbClient, getDbClients } from '@/clients/knex.js'
import { logger } from '@/observability/logging.js'
import { databaseMonitorCollectionPeriodSeconds } from '@/utils/env.js'
import { join } from 'lodash-es'
import { Histogram, Registry } from 'prom-client'
import prometheusClient from 'prom-client'
import { init as commits } from '@/observability/metrics/commits.js'
import { init as connections } from '@/observability/metrics/connections.js'
import { init as connectionsTotal } from '@/observability/metrics/connectionsTotal.js'
import { init as dbSize } from '@/observability/metrics/dbSize.js'
import { init as fileImports } from '@/observability/metrics/fileImports.js'
import { init as fileSize } from '@/observability/metrics/fileSize.js'
import { init as objects } from '@/observability/metrics/objects.js'
import { init as previews } from '@/observability/metrics/previews.js'
import { init as streams } from '@/observability/metrics/streams.js'
import { init as tablesize } from '@/observability/metrics/tableSize.js'
import { init as users } from '@/observability/metrics/users.js'
import { init as webhooks } from '@/observability/metrics/webhooks.js'

let prometheusInitialized = false

function isPrometheusInitialized() {
  return prometheusInitialized
}

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<string, number[]>
  getDbClients: () => Promise<DbClient[]>
}

type MetricsMonitor = {
  start: () => () => void
}

function initMonitoringMetrics(params: {
  register: Registry
  collectionPeriodMilliseconds: number
  config: MetricConfig
}): MetricsMonitor {
  logger.info('Initializing monitoring metrics...')
  const { register, collectionPeriodMilliseconds, config } = params
  const registers = register ? [register] : undefined
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = Object.keys(labels)
  const getDbClients = config.getDbClients

  const metricsToInitialize = [
    commits,
    connections,
    connectionsTotal,
    dbSize,
    fileImports,
    fileSize,
    objects,
    previews,
    streams,
    tablesize,
    users,
    webhooks
  ]

  const metricsToCollect = metricsToInitialize.map((metricToInitialize) =>
    metricToInitialize({ labelNames, namePrefix, logger })
  )

  const selfMonitor = new Histogram({
    name: join([namePrefix, 'self_monitor_time_monitoring_metrics'], '_'),
    help: 'The time taken to collect all of the database monitoring metrics, seconds.',
    registers,
    buckets: [0, 0.1, 0.25, 0.5, 1, 2, 5, 10],
    labelNames
  })

  const collect = async () => {
    const dbClients = await getDbClients()

    const mainDbClient = dbClients.find((c) => c.isMain)?.client
    if (!mainDbClient) {
      logger.warn('Could not find main database client')
      return
    }

    await Promise.all(
      metricsToCollect.map(async (metric) => {
        await metric({ dbClients, mainDbClient, labels })
      })
    )
  }

  return {
    start: () => {
      const intervalId = setInterval(() => {
        void (async () => {
          const end = selfMonitor.startTimer()
          await collect()
          const duration = end()
          logger.info(
            { metricsCollectionDurationSeconds: duration },
            'Collected monitoring metrics in {metricsCollectionDurationSeconds} seconds'
          )
        })()
      }, collectionPeriodMilliseconds)
      return () => clearInterval(intervalId) // returns a handle which can be called to stop the monitoring
    }
  }
}

export function initPrometheusMetrics() {
  logger.info('Initializing Prometheus metrics...')
  if (isPrometheusInitialized()) {
    logger.info('Prometheus metrics already initialized')
    return
  }

  prometheusInitialized = true

  prometheusClient.register.clear()
  prometheusClient.register.setDefaultLabels({
    project: 'speckle-server',
    app: 'monitor-deployment'
  })

  try {
    prometheusClient.collectDefaultMetrics()
    const monitoringMetrics = initMonitoringMetrics({
      register: prometheusClient.register,
      collectionPeriodMilliseconds: databaseMonitorCollectionPeriodSeconds() * 1000,
      config: {
        getDbClients,
        prefix: 'speckle'
      }
    })
    monitoringMetrics.start()
  } catch (e) {
    logger.error(e, 'Failed to initialize Prometheus metrics.')
    prometheusInitialized = false
  }
}
