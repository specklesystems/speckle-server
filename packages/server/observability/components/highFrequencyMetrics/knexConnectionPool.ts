import { Histogram, Registry } from 'prom-client'
import type { Metric } from '@/observability/components/highFrequencyMetrics/highfrequencyMonitoring'
import type { Knex } from 'knex'
import { numberOfFreeConnections } from '@/modules/shared/helpers/dbHelper'

const KNEX_CONNECTIONS_FREE = 'knex_connections_free_high_frequency'
const KNEX_CONNECTIONS_USED = 'knex_connections_used_high_frequency'
const KNEX_PENDING_ACQUIRES = 'knex_pending_acquires_high_frequency'
const KNEX_PENDING_CREATES = 'knex_pending_creates_high_frequency'
const KNEX_PENDING_VALIDATIONS = 'knex_pending_validations_high_frequency'
const KNEX_REMAINING_CAPACITY = 'knex_remaining_capacity_high_frequency'

type BucketName =
  | typeof KNEX_CONNECTIONS_FREE
  | typeof KNEX_CONNECTIONS_USED
  | typeof KNEX_PENDING_ACQUIRES
  | typeof KNEX_PENDING_CREATES
  | typeof KNEX_PENDING_VALIDATIONS
  | typeof KNEX_REMAINING_CAPACITY

const DEFAULT_KNEX_TOTAL_BUCKETS = {
  KNEX_CONNECTIONS_FREE: [0, 1, 2, 5, 10, 20],
  KNEX_CONNECTIONS_USED: [0, 1, 2, 5, 10, 20],
  KNEX_PENDING_ACQUIRES: [0, 1, 2, 5, 10, 20],
  KNEX_PENDING_CREATES: [0, 1, 2, 5, 10, 20],
  KNEX_PENDING_VALIDATIONS: [0, 1, 2, 5, 10, 20],
  KNEX_REMAINING_CAPACITY: [0, 1, 2, 5, 10, 20]
}

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<BucketName, number[]>
  getDbClients: () => Promise<
    Array<{ client: Knex; isMain: boolean; regionKey: string }>
  >
}

export const knexConnections = (
  registers: Registry[],
  config: MetricConfig
): Metric => {
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = [...Object.keys(labels), 'region']
  const buckets = { ...DEFAULT_KNEX_TOTAL_BUCKETS, ...config.buckets }

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_CONNECTIONS_FREE)
  })
  const knexConnectionsFree = new Histogram({
    name: namePrefix + KNEX_CONNECTIONS_FREE,
    help: 'Number of free DB connections. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.KNEX_CONNECTIONS_FREE,
    labelNames
  })

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_CONNECTIONS_USED)
  })
  const knexConnectionsUsed = new Histogram({
    name: namePrefix + KNEX_CONNECTIONS_USED,
    help: 'Number of used DB connections',
    registers,
    buckets: buckets.KNEX_CONNECTIONS_USED,
    labelNames
  })

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_PENDING_ACQUIRES)
  })
  const knexPendingAcquires = new Histogram({
    name: namePrefix + KNEX_PENDING_ACQUIRES,
    help: 'Number of pending DB connection aquires',
    registers,
    buckets: buckets.KNEX_PENDING_ACQUIRES,
    labelNames
  })

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_PENDING_CREATES)
  })
  const knexPendingCreates = new Histogram({
    name: namePrefix + KNEX_PENDING_CREATES,
    help: 'Number of pending DB connection creates',
    registers,
    buckets: buckets.KNEX_PENDING_CREATES,
    labelNames
  })

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_PENDING_VALIDATIONS)
  })
  const knexPendingValidations = new Histogram({
    name: namePrefix + KNEX_PENDING_VALIDATIONS,
    help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
    registers,
    buckets: buckets.KNEX_PENDING_VALIDATIONS,
    labelNames
  })

  registers.forEach((r) => {
    r.removeSingleMetric(namePrefix + KNEX_REMAINING_CAPACITY)
  })
  const knexRemainingCapacity = new Histogram({
    name: namePrefix + KNEX_REMAINING_CAPACITY,
    help: 'Remaining capacity of the DB connection pool',
    registers,
    buckets: buckets.KNEX_REMAINING_CAPACITY,
    labelNames
  })

  return {
    collect: async () => {
      for (const dbClient of await config.getDbClients()) {
        const labelsAndRegion = { ...labels, region: dbClient.regionKey }
        const connPool = dbClient.client.client.pool

        knexConnectionsFree.observe(labelsAndRegion, connPool.numFree())
        knexConnectionsUsed.observe(labelsAndRegion, connPool.numUsed())
        knexPendingAcquires.observe(labelsAndRegion, connPool.numPendingAcquires())
        knexPendingCreates.observe(labelsAndRegion, connPool.numPendingCreates())
        knexPendingValidations.observe(
          labelsAndRegion,
          connPool.numPendingValidations()
        )
        knexRemainingCapacity.observe(
          labelsAndRegion,
          numberOfFreeConnections(dbClient.client)
        )
      }
    }
  }
}
