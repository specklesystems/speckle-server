import { DbClient, getDbClients } from '@/clients/knex.js'
import { logger } from '@/observability/logging.js'
import { databaseMonitorCollectionPeriodSeconds } from '@/utils/env.js'
import { Knex } from 'knex'
import { join } from 'lodash-es'
import { Gauge, Histogram, Registry } from 'prom-client'
import prometheusClient from 'prom-client'

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

type WithOnDemandCollector<T> = T & {
  triggerCollect?: (params: {
    dbClients: DbClient[]
    mainDbClient: Knex
  }) => Promise<void>
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

  const dbSize: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_size'], '_'),
    help: 'Size of the entire database (in bytes)',
    labelNames: ['region', ...labelNames]
  })
  dbSize.triggerCollect = async (params) => {
    const { dbClients } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey, databaseName }) => {
        if (!databaseName) {
          logger.warn(
            { region: regionKey },
            "Could not get database name from client config for region '{region}'"
          )
          return
        }

        logger.info(
          { region: regionKey, databaseName },
          "Collecting database size for region '{region}' from database '{databaseName}'"
        )

        const dbSizeResult = await client.raw<{
          rows: [{ pg_database_size: string }] //bigints are returned as strings
        }>('SELECT pg_database_size(?) LIMIT 1', [databaseName])
        dbSize.set(
          { ...labels, region: regionKey },
          parseInt(dbSizeResult.rows[0].pg_database_size) //NOTE risk this bigint being too big for JS, but that would be a very large database!
        )
      })
    )
  }

  const objects: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_objects'], '_'),
    help: 'Number of objects',
    labelNames
  })
  objects.triggerCollect = async (params) => {
    const { mainDbClient } = params

    const objectsEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
      "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'objects' LIMIT 1;"
    )
    objects.set({ ...labels }, Math.max(objectsEstimate.rows[0].estimate, 0))
  }

  const streams: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_streams'], '_'),
    help: 'Number of streams/projects',
    labelNames
  })
  streams.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const streamsEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
      "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'streams' LIMIT 1;"
    )
    streams.set({ ...labels }, Math.max(streamsEstimate.rows[0].estimate))
  }

  const commits: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_commits'], '_'),
    help: 'Number of commits/versions',
    labelNames
  })
  commits.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const commitsEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
      "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'commits' LIMIT 1;"
    )
    commits.set({ ...labels }, Math.max(commitsEstimate.rows[0].estimate))
  }

  const users: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_users'], '_'),
    help: 'Number of users',
    labelNames
  })
  users.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const usersEstimate = await mainDbClient.raw<{ rows: [{ estimate: number }] }>(
      "SELECT reltuples AS estimate FROM pg_class WHERE relname = 'users' LIMIT 1;"
    )
    users.set({ ...labels }, Math.max(usersEstimate.rows[0].estimate))
  }

  const fileimports: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_fileimports'], '_'),
    help: 'Number of imported files, by type and status',
    labelNames: ['filetype', 'status', ...labelNames]
  })
  fileimports.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const importedFiles = await mainDbClient.raw<{
      rows: [{ fileType: string; convertedStatus: number; count: string }]
    }>(
      `
        SELECT LOWER("fileType") AS "fileType", "convertedStatus", count(*)
          FROM file_uploads
          GROUP BY (LOWER("fileType"), "convertedStatus");
      `
    )

    // Get the set of all unique file types and converted statuses in the database
    const allFileImportConvertedStatusAndFileTypes = importedFiles.rows.reduce(
      (acc, row) => {
        acc.convertedStatus.add(row.convertedStatus)
        acc.fileType.add(row.fileType)
        return acc
      },
      { convertedStatus: new Set<number>(), fileType: new Set<string>() }
    )

    // now calculate the combinatorial set of all possible file types and statuses
    const remainingConvertedStatusAndFileTypes = new Set<{
      fileType: string
      status: number
    }>()
    allFileImportConvertedStatusAndFileTypes.convertedStatus.forEach((status) => {
      allFileImportConvertedStatusAndFileTypes.fileType.forEach((fileType) => {
        remainingConvertedStatusAndFileTypes.add({ fileType, status })
      })
    })

    // now set the counts for the file types and statuses that are in the database
    for (const row of importedFiles.rows) {
      remainingConvertedStatusAndFileTypes.delete({
        fileType: row.fileType,
        status: row.convertedStatus
      })
      fileimports.set(
        { ...labels, filetype: row.fileType, status: row.convertedStatus.toString() },
        parseInt(row.count)
      )
    }
    // zero-values for all remaining file types and statuses
    remainingConvertedStatusAndFileTypes.forEach(({ fileType, status }) => {
      fileimports.set({ ...labels, filetype: fileType, status: status.toString() }, 0)
    })
  }

  const filesize: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_filesize'], '_'),
    help: 'Size of imported files, by type (in bytes)',
    labelNames: ['filetype', ...labelNames]
  })
  filesize.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const fileSizeResults = await mainDbClient.raw<{
      rows: [{ fileType: string; fileSize: number }]
    }>(
      `
      SELECT LOWER("fileType") AS fileType, SUM("fileSize") AS fileSize
            FROM file_uploads
            GROUP BY LOWER("fileType");
      `
    )
    for (const row of fileSizeResults.rows) {
      filesize.set({ ...labels, filetype: row.fileType }, row.fileSize)
    }
  }

  const webhooks: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_webhooks'], '_'),
    help: 'Number of webhook calls, by status',
    labelNames: ['status', ...labelNames]
  })
  webhooks.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const webhookResults = await mainDbClient.raw<{
      rows: [{ status: number; count: string }]
    }>(
      `
        SELECT status, count(*)
        FROM webhooks_events
        GROUP BY status;
      `
    )
    const remainingWebhookStatus = new Set(Array(4).keys())
    for (const row of webhookResults.rows) {
      remainingWebhookStatus.delete(row.status)
      webhooks.set(
        { ...labels, status: row.status.toString() },
        parseInt(row.count) //NOTE risk this bigint being too big for JS, but that would be a very large number of webhooks
      )
    }
    // zero-values for all remaining webhook statuses
    remainingWebhookStatus.forEach((status) => {
      webhooks.set({ ...labels, status: status.toString() }, 0)
    })
  }

  const previews: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_previews'], '_'),
    help: 'Number of previews, by status',
    labelNames: ['status', ...labelNames]
  })
  previews.triggerCollect = async (params) => {
    const { mainDbClient } = params
    const previewStatusResults = await mainDbClient.raw<{
      rows: [{ previewStatus: number; count: string }]
    }>(`
        SELECT "previewStatus", count(*)
        FROM object_preview
        GROUP BY "previewStatus";
        `)

    const remainingPreviewStatus = new Set(Array(4).keys())
    for (const row of previewStatusResults.rows) {
      remainingPreviewStatus.delete(row.previewStatus)
      previews.set(
        { ...labels, status: row.previewStatus.toString() },
        parseInt(row.count)
      )
    }
    // zero-values for all remaining preview statuses
    remainingPreviewStatus.forEach((status) => {
      previews.set({ ...labels, status: status.toString() }, 0)
    })
  }

  const tablesize: WithOnDemandCollector<Gauge<string>> = new prometheusClient.Gauge({
    name: join([namePrefix, 'db_tablesize'], '_'),
    help: 'Size of tables in the database, by table (in bytes)',
    labelNames: ['table', 'region', ...labelNames]
  })
  tablesize.triggerCollect = async (params) => {
    const { dbClients } = params
    await Promise.all(
      dbClients.map(async ({ client, regionKey }) => {
        const tableSizeResults = await client.raw<{
          rows: [{ table_name: string; table_size: string }] //bigints are returned as strings
        }>(
          `
            SELECT
              table_name,
              table_size

            FROM (
                  SELECT
                    pg_catalog.pg_namespace.nspname           AS schema_name,
                    relname                                   AS table_name,
                    pg_relation_size(pg_catalog.pg_class.oid) AS table_size

                  FROM pg_catalog.pg_class
                    JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
                ) t
            WHERE schema_name = 'public'
            ORDER BY table_size DESC;
          `
        )
        for (const row of tableSizeResults.rows) {
          tablesize.set(
            { ...labels, table: row.table_name, region: regionKey },
            parseInt(row.table_size) //NOTE risk this bigint being too big for JS, but that would be a very large table!
          )
        }
      })
    )
  }

  const metricsToCollect = [
    dbSize,
    tablesize,
    objects,
    streams,
    commits,
    users,
    fileimports,
    filesize,
    webhooks,
    previews
  ]

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
        await metric.triggerCollect?.({ dbClients, mainDbClient })
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
