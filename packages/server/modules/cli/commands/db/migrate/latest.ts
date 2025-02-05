import { logger } from '@/logging/logging'
import { CommonDbArgs, getTargettedDbClients } from '@/modules/cli/commands/db/helpers'
import { CommandModule } from 'yargs'

const command: CommandModule<unknown, CommonDbArgs> = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler(argv) {
    logger.info('Running latest migrations on DB instances!')
    const { regionKey } = argv

    const dbs = await getTargettedDbClients({ regionKey })
    for (const db of dbs) {
      logger.info(`Running latest on DB ${db.regionKey}...`)
      await db.client.migrate.latest()
    }

    logger.info('Completed running migration')
  }
}

export = command
