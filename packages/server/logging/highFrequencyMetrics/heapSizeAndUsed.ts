/**
   Adapted from prom-client: https://github.com/siimon/prom-client/tree/master/lib/metrics

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

const NODEJS_HEAP_SIZE_TOTAL = 'nodejs_heap_size_total_bytes_high_frequency'
const NODEJS_HEAP_SIZE_USED = 'nodejs_heap_size_used_bytes_high_frequency'
const NODEJS_EXTERNAL_MEMORY = 'nodejs_external_memory_bytes_high_frequency'

type BucketName =
  | typeof NODEJS_HEAP_SIZE_TOTAL
  | typeof NODEJS_HEAP_SIZE_USED
  | typeof NODEJS_EXTERNAL_MEMORY

const DEFAULT_NODEJS_HEAP_SIZE_BUCKETS = {
  NODEJS_HEAP_SIZE_TOTAL: [0, 0.1e9, 0.25e9, 0.5e9, 0.75e9, 1e9, 2e9], //TODO: check if this is the right default
  NODEJS_HEAP_SIZE_USED: [0, 0.1e9, 0.25e9, 0.5e9, 0.75e9, 1e9, 2e9], //TODO: check if this is the right default
  NODEJS_EXTERNAL_MEMORY: [0, 0.1e9, 0.25e9, 0.5e9, 0.75e9, 1e9, 2e9] //TODO: check if this is the right default
}

type MetricConfig = {
  prefix?: string
  labels?: Record<string, string>
  buckets?: Record<BucketName, number[]>
}

export const heapSizeAndUsed = (
  registry: Registry,
  config: MetricConfig = {}
): Metric => {
  const registers = registry ? [registry] : undefined
  const namePrefix = config.prefix ?? ''
  const labels = config.labels ?? {}
  const labelNames = Object.keys(labels)
  const buckets = { ...DEFAULT_NODEJS_HEAP_SIZE_BUCKETS, ...config.buckets }

  const heapSizeTotal = new Histogram({
    name: namePrefix + NODEJS_HEAP_SIZE_TOTAL,
    help: 'Process heap size from Node.js in bytes. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.NODEJS_HEAP_SIZE_TOTAL,
    labelNames
  })
  const heapSizeUsed = new Histogram({
    name: namePrefix + NODEJS_HEAP_SIZE_USED,
    help: 'Process heap size used from Node.js in bytes. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.NODEJS_HEAP_SIZE_USED,
    labelNames
  })
  const externalMemUsed = new Histogram({
    name: namePrefix + NODEJS_EXTERNAL_MEMORY,
    help: 'Node.js external memory size in bytes. This data is collected at a higher frequency than Prometheus scrapes, and is presented as a Histogram.',
    registers,
    buckets: buckets.NODEJS_EXTERNAL_MEMORY,
    labelNames
  })

  return {
    collect: () => {
      const memUsage = safeMemoryUsage()
      if (memUsage) {
        heapSizeTotal.observe(labels, memUsage.heapTotal)
        heapSizeUsed.observe(labels, memUsage.heapUsed)
        if (memUsage.external !== undefined) {
          externalMemUsed.observe(labels, memUsage.external)
        }
      }
    }
  }
}

function safeMemoryUsage() {
  try {
    return process.memoryUsage()
  } catch {
    return
  }
}
