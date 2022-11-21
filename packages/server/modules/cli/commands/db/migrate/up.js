const knex = require('@/db/knex')
const { Logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'up',
  describe: 'Run next migration that has not yet been run',
  async handler() {
    Logger.info('Running next migration...')
    await knex.migrate.up()
    Logger.info('Completed running next migration')
  }
}

module.exports = command
