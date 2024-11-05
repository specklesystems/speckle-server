import knex from '@/db/knex'
import { logger } from '@/logging/logging'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler() {
    logger.info('Rolling back migrations...')
    await knex.migrate.rollback(undefined, true)
    logger.info('Completed rolling back migrations')
  }
}

export = command
