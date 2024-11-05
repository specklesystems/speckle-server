import knex from '@/db/knex'
import { appRoot } from '@/bootstrap'
import fs from 'fs/promises'
import { logger } from '@/logging/logging'
import { CommandModule } from 'yargs'

/** @type {import('yargs').CommandModule} */
const command: CommandModule<unknown, { name: string; module: string }> = {
  command: 'create <name> [module]',
  describe: 'Create a new migration',
  builder: {
    name: {
      describe: 'Migration name',
      type: 'string'
    },
    module: {
      describe: 'The server module into which this migration should be generated',
      type: 'string',
      default: 'core'
    }
  },
  async handler(argv) {
    const name = argv.name
    const migrationDir = `${appRoot}/modules/${argv.module}/migrations`

    try {
      await fs.access(migrationDir)
    } catch {
      throw new Error(
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

export = command
