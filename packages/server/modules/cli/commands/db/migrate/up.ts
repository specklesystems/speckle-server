import { logger } from '@/logging/logging'
import { CommonDbArgs, getTargettedDbClients } from '@/modules/cli/commands/db/helpers'
import { CommandModule } from 'yargs'

const command: CommandModule<unknown, CommonDbArgs> = {
  command: 'up',
  describe: 'Run next migration that has not yet been run',
  async handler(argv) {
    const { regionKey } = argv

    logger.info('Running next migration...')

    const dbs = await getTargettedDbClients({ regionKey })
    for (const db of dbs) {
      logger.info(`Running next migration on DB ${db.regionKey}...`)
      await db.client.migrate.up()
    }

    logger.info('Completed running next migration')
  }
}

export = command
