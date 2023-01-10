const knex = require('@/db/knex')
const { logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'up',
  describe: 'Run next migration that has not yet been run',
  async handler() {
    logger.info('Running next migration...')
    await knex.migrate.up()
    logger.info('Completed running next migration')
  }
}

module.exports = command
