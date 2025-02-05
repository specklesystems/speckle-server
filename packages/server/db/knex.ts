/* istanbul ignore file */
const env = process.env.NODE_ENV || 'development'
import configs from '@/knexfile'
import { dbStartupLogger } from '@/logging/logging'
import knex from 'knex'

const config = configs[env]

config.log = {
  warn(message) {
    if (
      message ===
      'FS-related option specified for migration configuration. This resets migrationSource to default FsMigrations'
    )
      return
  }
}

dbStartupLogger.debug(`Loaded knex conf for ${env}`)

const knexInstance = knex(config)

export default knexInstance
export {
  knexInstance as db,
  knexInstance as knex,
  knexInstance as mainDb,
  knexInstance,
  config
}
