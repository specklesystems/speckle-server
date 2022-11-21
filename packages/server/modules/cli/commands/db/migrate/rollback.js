const knex = require('@/db/knex')
const { Logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler() {
    Logger.info('Rolling back migrations...')
    await knex.migrate.rollback(null, true)
    Logger.info('Completed rolling back migrations')
  }
}

module.exports = command
