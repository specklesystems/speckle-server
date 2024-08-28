const knex = require('@/db/knex')
const { appRoot } = require('@/bootstrap')
const fs = require('fs/promises')
const { logger } = require('@/logging/logging')
const { MisconfiguredEnvironmentError } = require('@/modules/shared/errors')

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
    } catch {
      throw new MisconfiguredEnvironmentError(
        `Migration directory '${migrationDir}' is not accessible! Check if it exists.`
      )
    }

    logger.info('Creating migration...')
    await knex.migrate.make(name, {
      directory: migrationDir,
      extension: 'ts'
    })
    logger.info('Creation done')
  }
}

module.exports = command
