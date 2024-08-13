/* istanbul ignore file */
'use strict'

const env = process.env.NODE_ENV || 'development'
const configs = require('@/knexfile.js')
const { dbStartupLogger } = require('@/logging/logging')
const { postgresQueryTimeoutSeconds } = require('@/modules/shared/helpers/envHelper')
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

dbStartupLogger.info(`Loaded knex conf for ${env}`)

/**
 * Need to override type because type def file incorrectly uses ES6
 * @type {import('knex').default}
 */
const knex = require('knex')
const instance = knex(config)
const knexInstance = (params) => {
  return instance(params).timeout(postgresQueryTimeoutSeconds() * 1000, {
    cancel: true
  })
}

module.exports = knexInstance
module.exports.db = knexInstance
