import configs from '@/knexfile'
import { dbStartupLogger } from '@/logging/logging'
import {
  postgresQueryTimeoutSeconds,
  nodeEnv
} from '@/modules/shared/helpers/envHelper'
import knex, { Knex } from 'knex'

const env = nodeEnv() || 'development'
const config = configs[env]

config.log = {
  warn(message: string) {
    if (
      message ===
      'FS-related option specified for migration configuration. This resets migrationSource to default FsMigrations'
    )
      return
  }
}

dbStartupLogger.info(`Loaded knex conf for ${env}`)

/**
 * Need to override type because type def file incorrectly uses ES6
 * @type {import('knex').default}
 */
const instance = knex(config)
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
const knexInstance = <TRecord extends {} = any, TResult = any[]>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any
): Knex<TRecord, TResult> => {
  const k = instance(params)
  return {
    ...k,
    select: () =>
      k.select().timeout(postgresQueryTimeoutSeconds() * 1000, {
        cancel: true
      })
  }
}

export default knexInstance
export const db = knexInstance
