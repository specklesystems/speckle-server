const knex = require('@/db/knex')
const { logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler() {
    logger.info('Rolling back migrations...')
    await knex.migrate.rollback(null, true)
    logger.info('Completed rolling back migrations')
  }
}

module.exports = command
