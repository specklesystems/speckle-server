const knex = require('@/db/knex')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'down',
  describe: 'Undo last run migration',
  async handler() {
    console.log('Undoing last migration...')
    await knex.migrate.down()
    console.log('...done')
  }
}

module.exports = command
