const knex = require('@/db/knex')
const { logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'down',
  describe: 'Undo last run migration',
  async handler() {
    logger.info('Undoing last migration...')
    await knex.migrate.down()
    logger.info('Completed undoing last migration')
  }
}

module.exports = command
