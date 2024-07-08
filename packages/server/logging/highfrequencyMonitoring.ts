/**
 * High frequency monitoring, collects data related to CPU, memory, and network usage
 * at a higher frequency than the default prometheus monitoring. It makes the data
 * available to Prometheus via an histogram.
 */

import { Histogram, Registry } from 'prom-client'

const PROCESS_CPU_USER_SECONDS = 'process_cpu_user_seconds_total_high_frequency'
const PROCESS_CPU_SYSTEM_SECONDS = 'process_cpu_system_seconds_total_high_frequency'
const PROCESS_CPU_SECONDS = 'process_cpu_seconds_total_high_frequency'
const DEFAULT_CPU_TOTAL_BUCKETS = [0, 0.1, 0.25, 0.5, 0.75, 1] //TODO: check if this is the right default

export const initHighFrequencyMonitoring = (params: {
  register: Registry
  collectionPeriodMilliseconds: number
}) => {
  const { collectionPeriodMilliseconds } = params
  const metrics = [
    processCpuTotal(params.register) //TODO config
  ]

  let _shouldStop = false
  const shouldStop = () => _shouldStop
  const stop = () => (_shouldStop = true)

  return {
    start: collectHighFrequencyMetrics({
      shouldStop,
      metrics,
      collectionPeriodMilliseconds
    }),
    stop
  }
}

interface Metric {
  tick: () => void
}
const collectHighFrequencyMetrics = (params: {
  shouldStop: () => boolean
  collectionPeriodMilliseconds: number
  metrics: Metric[]
}) => {
  const { shouldStop, metrics, collectionPeriodMilliseconds } = params
  return async () => {
    if (shouldStop()) {
      return
    }

    for (const metric of metrics) {
      metric.tick()
    }

    setTimeout(collectHighFrequencyMetrics, collectionPeriodMilliseconds)
  }
}

type ProcessCpuTotalConfig = {
  prefix?: string
  labels?: Record<string, string>
  cpuTotalBuckets?: number[]
}
const processCpuTotal = (registry: Registry, config: ProcessCpuTotalConfig = {}) => {
  const registers = registry ? [registry] : undefined
  const namePrefix = config.prefix ? config.prefix : ''
  const labels = config.labels ? config.labels : {}
  const labelNames = Object.keys(labels)
  const buckets = config.cpuTotalBuckets
    ? config.cpuTotalBuckets
    : DEFAULT_CPU_TOTAL_BUCKETS

  const cpuUserUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_USER_SECONDS,
    help: 'Total user CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    labelNames,
    buckets,
    registers
  })
  const cpuSystemUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_SYSTEM_SECONDS,
    help: 'Total system CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets, //TODO separate buckets
    labelNames
  })
  const cpuUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_SECONDS,
    help: 'Total user and system CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets, //TODO separate buckets
    labelNames
  })

  let lastCpuUsage = process.cpuUsage()

  return {
    tick: () => {
      const cpuUsage = process.cpuUsage()

      const userUsageMicros = cpuUsage.user - lastCpuUsage.user
      const systemUsageMicros = cpuUsage.system - lastCpuUsage.system

      lastCpuUsage = cpuUsage

      cpuUserUsageHistogram.observe(labels, userUsageMicros / 1e6)
      cpuSystemUsageHistogram.observe(labels, systemUsageMicros / 1e6)
      cpuUsageHistogram.observe(labels, (userUsageMicros + systemUsageMicros) / 1e6)
    }
  }
}
