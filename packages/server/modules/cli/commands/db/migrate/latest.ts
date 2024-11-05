import knex from '@/db/knex'
import { logger } from '@/logging/logging'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler() {
    logger.info('Running latest migration...')
    await knex.migrate.latest()
    logger.info('Completed running migration')
  }
}

export = command
