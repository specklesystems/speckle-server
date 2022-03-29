const knex = require('@/db/knex')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler() {
    console.log('Running...')
    await knex.migrate.latest()
    console.log('...done')
  }
}

module.exports = command
