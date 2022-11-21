const knex = require('@/db/knex')
const { Logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'down',
  describe: 'Undo last run migration',
  async handler() {
    Logger.info('Undoing last migration...')
    await knex.migrate.down()
    Logger.info('Completed undoing last migration')
  }
}

module.exports = command
