const knex = require('@/db/knex')
const { appRoot } = require('@/bootstrap')
const fs = require('fs/promises')
const { Logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'create <name> [module]',
  describe: 'Create a new migration',
  builder(yargs) {
    return yargs
      .positional('name', {
        describe: 'Migration name',
        type: 'string'
      })
      .positional('module', {
        describe: 'The server module into which this migration should be generated',
        type: 'string',
        default: 'core'
      })
  },
  async handler(argv) {
    const name = argv.name
    const migrationDir = `${appRoot}/modules/${argv.module}/migrations`

    try {
      await fs.access(migrationDir)
    } catch (e) {
      throw new Error(
        `Migration directory '${migrationDir}' is not accessible! Check if it exists.`
      )
    }

    Logger.info('Creating migration...')
    await knex.migrate.make(name, {
      directory: migrationDir,
      extension: 'ts'
    })
    Logger.info('migration is complete')
  }
}

module.exports = command
