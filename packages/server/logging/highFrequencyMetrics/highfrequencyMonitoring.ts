/**
 * High frequency monitoring, collects data related to CPU, memory, and network usage
 * at a higher frequency than the default prometheus monitoring. It makes the data
 * available to Prometheus via an histogram.
 */

import { Registry } from 'prom-client'
import { processCpuTotal } from '@/logging/highFrequencyMetrics/processCPUTotal'

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<string, number[]>
}

export const initHighFrequencyMonitoring = (params: {
  register: Registry
  collectionPeriodMilliseconds: number
  config?: MetricConfig
}) => {
  const { register, config, collectionPeriodMilliseconds } = params
  const metrics = [processCpuTotal(register, config)]

  return {
    start: collectHighFrequencyMetrics({
      metrics,
      collectionPeriodMilliseconds
    })
  }
}

interface Metric {
  tick: () => void
}
const collectHighFrequencyMetrics = (params: {
  collectionPeriodMilliseconds: number
  metrics: Metric[]
}) => {
  const { metrics, collectionPeriodMilliseconds } = params
  return () => {
    const intervalId = setInterval(() => {
      for (const metric of metrics) {
        metric.tick()
      }
    }, collectionPeriodMilliseconds)
    return () => clearInterval(intervalId)
  }
}
