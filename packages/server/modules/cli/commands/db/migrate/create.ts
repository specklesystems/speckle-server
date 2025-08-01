import knex from '@/db/knex'
import { appRoot } from '@/bootstrap'
import fs from 'fs/promises'
import { cliLogger as logger } from '@/observability/logging'
import type { CommandModule } from 'yargs'
import { ensureError } from '@speckle/shared'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'

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
    } catch (e) {
      const cause = ensureError(e)
      if (cause.message.toLowerCase().includes('no such file or directory')) {
        // Try to create it
        await fs.mkdir(migrationDir, { recursive: true })
      } else {
        throw new MisconfiguredEnvironmentError(
          `Migration directory '${migrationDir}' is not accessible! Check if it exists.`,
          { cause }
        )
      }
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
