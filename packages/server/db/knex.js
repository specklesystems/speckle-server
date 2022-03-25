/* istanbul ignore file */
'use strict'

const env = process.env.NODE_ENV || 'development'
const configs = require('@/knexfile.js')
const config = configs[env]
const { isTestEnv } = require('@/modules/core/helpers/envHelper')
const testMode = isTestEnv()

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

/** @type {import('knex').Knex.Transaction} */
let connectionLevelTransaction = null

/**
 * @returns {import('knex').Knex}
 */
const pickTarget = (knxInstance) => connectionLevelTransaction || knxInstance

/**
 * Enable transaction mode for the entire connection
 * @param {boolean} [enable=true]
 * @returns {Promise}
 */
async function connectionTransaction(enable = true) {
  if (enable) {
    // console.log('ON ')
    if (connectionLevelTransaction) return
    connectionLevelTransaction = await knexInstance.transaction()
  } else {
    // console.log('OFF ')

    if (!connectionLevelTransaction) return
    connectionLevelTransaction.rollback()
    connectionLevelTransaction = null
  }
}

function commit() {
  if (connectionLevelTransaction) {
    connectionLevelTransaction.commit()
  }
}

function rollback() {
  if (connectionLevelTransaction) {
    connectionLevelTransaction.rollback()
  }
}

const knx = new Proxy(knexInstance, {
  apply(target, thisArg, argumentsList) {
    return pickTarget(target).apply(thisArg, argumentsList)
  },
  get(target, prop) {
    if (prop === 'connectionTransaction') {
      return connectionTransaction
    }

    if (prop === 'commit') {
      return commit
    }

    if (prop === 'rollback') {
      return rollback
    }

    return pickTarget(target)[prop]
  }
})

module.exports = testMode ? knx : knexInstance
