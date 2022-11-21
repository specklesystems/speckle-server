const knex = require('@/db/knex')
const { Logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler() {
    Logger.info('Running latest migration...')
    await knex.migrate.latest()
    Logger.info('Completed running migration')
  }
}

module.exports = command
