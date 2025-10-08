import { cliLogger as logger } from '@/observability/logging'
import type { CommonDbArgs } from '@/modules/cli/commands/db/helpers'
import { getTargettedDbClients } from '@/modules/cli/commands/db/helpers'
import type { CommandModule } from 'yargs'

const command: CommandModule<unknown, CommonDbArgs> = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler(argv) {
    const { regionKey } = argv

    logger.info('Rolling back migrations...')

    const dbs = await getTargettedDbClients({ regionKey })
    for (const db of dbs) {
      logger.info(`Rolling back DB ${db.regionKey}...`)
      await db.client.migrate.rollback(undefined, true)
    }

    logger.info('Completed rolling back migrations')
  }
}

export = command
