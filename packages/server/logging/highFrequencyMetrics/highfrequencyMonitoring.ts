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
  return async () =>
    setInterval(() => {
      if (shouldStop()) {
        return
      }

      for (const metric of metrics) {
        metric.tick()
      }
    }, collectionPeriodMilliseconds)
}
