const knex = require('@/db/knex')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler() {
    console.log('Rolling back...')
    await knex.migrate.rollback(null, true)
    console.log('...done')
  }
}

module.exports = command
