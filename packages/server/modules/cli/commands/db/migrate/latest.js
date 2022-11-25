const knex = require('@/db/knex')
const { logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler() {
    logger.info('Running latest migration...')
    await knex.migrate.latest()
    logger.info('Completed running migration')
  }
}

module.exports = command
