import { Histogram, Registry } from 'prom-client'
import type { Metric } from '@/logging/highFrequencyMetrics/highfrequencyMonitoring'
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
  knex: Knex
}

export const knexConnections = (registry: Registry, config: MetricConfig): Metric => {
  const registers = registry ? [registry] : undefined
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = Object.keys(labels)
  const buckets = { ...DEFAULT_KNEX_TOTAL_BUCKETS, ...config.buckets }
  const knex = config.knex

  const knexConnectionsFree = new Histogram({
    name: namePrefix + KNEX_CONNECTIONS_FREE,
    help: 'Number of free DB connections. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.KNEX_CONNECTIONS_FREE,
    labelNames
  })

  const knexConnectionsUsed = new Histogram({
    name: namePrefix + KNEX_CONNECTIONS_USED,
    help: 'Number of used DB connections',
    registers,
    buckets: buckets.KNEX_CONNECTIONS_USED,
    labelNames
  })

  const knexPendingAcquires = new Histogram({
    name: namePrefix + KNEX_PENDING_ACQUIRES,
    help: 'Number of pending DB connection aquires',
    registers,
    buckets: buckets.KNEX_PENDING_ACQUIRES,
    labelNames
  })

  const knexPendingCreates = new Histogram({
    name: namePrefix + KNEX_PENDING_CREATES,
    help: 'Number of pending DB connection creates',
    registers,
    buckets: buckets.KNEX_PENDING_CREATES,
    labelNames
  })

  const knexPendingValidations = new Histogram({
    name: namePrefix + KNEX_PENDING_VALIDATIONS,
    help: 'Number of pending DB connection validations. This is a state between pending acquisition and acquiring a connection.',
    registers,
    buckets: buckets.KNEX_PENDING_VALIDATIONS,
    labelNames
  })

  const knexRemainingCapacity = new Histogram({
    name: namePrefix + KNEX_REMAINING_CAPACITY,
    help: 'Remaining capacity of the DB connection pool',
    registers,
    buckets: buckets.KNEX_REMAINING_CAPACITY,
    labelNames
  })

  return {
    collect: () => {
      const connPool = knex.client.pool

      knexConnectionsFree.observe(labels, connPool.numFree())
      knexConnectionsUsed.observe(labels, connPool.numUsed())
      knexPendingAcquires.observe(labels, connPool.numPendingAcquires())
      knexPendingCreates.observe(labels, connPool.numPendingCreates())
      knexPendingValidations.observe(labels, connPool.numPendingValidations())
      knexRemainingCapacity.observe(labels, numberOfFreeConnections(knex))
    }
  }
}
