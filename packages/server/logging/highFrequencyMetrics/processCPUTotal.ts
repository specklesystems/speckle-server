/**
 * Adapted from prom-client: https://github.com/siimon/prom-client/tree/master/lib/metrics
 * 
   Copyright 2015 Simon Nyberg

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import { Histogram, Registry } from 'prom-client'
import type { Metric } from '@/logging/highFrequencyMetrics/highfrequencyMonitoring'

const PROCESS_CPU_USER_SECONDS = 'process_cpu_user_seconds_total_high_frequency'
const PROCESS_CPU_SYSTEM_SECONDS = 'process_cpu_system_seconds_total_high_frequency'
const PROCESS_CPU_SECONDS = 'process_cpu_seconds_total_high_frequency'

type BucketName =
  | typeof PROCESS_CPU_USER_SECONDS
  | typeof PROCESS_CPU_SYSTEM_SECONDS
  | typeof PROCESS_CPU_SECONDS

const DEFAULT_CPU_TOTAL_BUCKETS = {
  PROCESS_CPU_SECONDS: [0, 0.1, 0.25, 0.5, 0.75, 1, 2], //TODO: check if this is the right default
  PROCESS_CPU_USER_SECONDS: [0, 0.1, 0.25, 0.5, 0.75, 1, 2], //TODO: check if this is the right default
  PROCESS_CPU_SYSTEM_SECONDS: [0, 0.1, 0.25, 0.5, 0.75, 1, 2] //TODO: check if this is the right default
}

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<BucketName, number[]>
}

export const processCpuTotal = (
  registry: Registry,
  config: MetricConfig = {}
): Metric => {
  const registers = registry ? [registry] : undefined
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = Object.keys(labels)
  const buckets = { ...DEFAULT_CPU_TOTAL_BUCKETS, ...config.buckets }

  const cpuUserUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_USER_SECONDS,
    help: 'Total user CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    labelNames,
    buckets: buckets.PROCESS_CPU_USER_SECONDS,
    registers
  })
  const cpuSystemUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_SYSTEM_SECONDS,
    help: 'Total system CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.PROCESS_CPU_SYSTEM_SECONDS,
    labelNames
  })
  const cpuUsageHistogram = new Histogram({
    name: namePrefix + PROCESS_CPU_SECONDS,
    help: 'Total user and system CPU time spent in seconds. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.PROCESS_CPU_USER_SECONDS,
    labelNames
  })

  let lastCpuUsage = process.cpuUsage()

  return {
    collect: () => {
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
