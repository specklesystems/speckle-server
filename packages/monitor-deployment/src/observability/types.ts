import type { DbClient } from '@/clients/knex.js'
import type { Knex } from 'knex'
import type { Logger } from 'pino'

export type MetricConfig = { labelNames: string[]; namePrefix: string; logger: Logger }
export type MetricCollectionParameters = {
  dbClients: DbClient[]
  mainDbClient: Knex
  labels: Record<string, string>
}
export type MetricInitializer = (
  config: MetricConfig
) => (params: MetricCollectionParameters) => Promise<void>
