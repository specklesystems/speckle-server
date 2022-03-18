const knex = require('@/db/knex')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'up',
  describe: 'Run next migration that has not yet been run',
  async handler() {
    console.log('Running...')
    await knex.migrate.up()
    console.log('...done')
  }
}

module.exports = command
