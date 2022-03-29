/* istanbul ignore file */
'use strict'

const env = process.env.NODE_ENV || 'development'
const configs = require('@/knexfile.js')
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

const debug = require('debug')

debug('speckle:db-startup')(`Loaded knex conf for ${env}`)

/**
 * Need to override type because type def file incorrectly uses ES6
 * @type {import('knex').default}
 */
const knex = require('knex')
const knexInstance = knex(config)

module.exports = knexInstance
