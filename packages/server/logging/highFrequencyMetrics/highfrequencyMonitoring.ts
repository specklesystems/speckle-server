/**
 * High frequency monitoring, collects data related to CPU, memory, database, and network usage
 * at a higher frequency than the default prometheus monitoring. It makes the data
 * available to Prometheus via an histogram.
 */

import { Histogram, Registry } from 'prom-client'
import { processCpuTotal } from '@/logging/highFrequencyMetrics/processCPUTotal'
import { heapSizeAndUsed } from '@/logging/highFrequencyMetrics/heapSizeAndUsed'
import { knexConnections } from '@/logging/highFrequencyMetrics/knexConnectionPool'
import { type Knex } from 'knex'

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<string, number[]>
  knex: Knex
}

type HighFrequencyMonitor = {
  start: () => () => void
}

export const initHighFrequencyMonitoring = (params: {
  register: Registry
  collectionPeriodMilliseconds: number
  config: MetricConfig
}): HighFrequencyMonitor => {
  const { register, collectionPeriodMilliseconds } = params
  const config = params.config
  const registers = register ? [register] : undefined
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = Object.keys(labels)

  const metrics = [
    processCpuTotal(register, config),
    heapSizeAndUsed(register, config),
    knexConnections(register, config)
  ]

  const selfMonitor = new Histogram({
    name: namePrefix + 'self_monitor_time_high_frequency',
    help: 'The time taken to collect all of the high frequency metrics, seconds.',
    registers,
    buckets: [0, 0.001, 0.01, 0.025, 0.05, 0.1, 0.2],
    labelNames
  })

  return {
    start: collectHighFrequencyMetrics({
      selfMonitor,
      metrics,
      collectionPeriodMilliseconds
    })
  }
}

export interface Metric {
  collect: () => void
}

const collectHighFrequencyMetrics = (params: {
  selfMonitor: Histogram<string>
  collectionPeriodMilliseconds: number
  metrics: Metric[]
}) => {
  const { selfMonitor, metrics, collectionPeriodMilliseconds } = params
  return () => {
    const intervalId = setInterval(() => {
      const end = selfMonitor.startTimer()
      for (const metric of metrics) {
        metric.collect()
      }
      end()
    }, collectionPeriodMilliseconds)
    return () => clearInterval(intervalId)
  }
}
