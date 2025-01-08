import { logger } from '@/logging/logging'
import { CommonDbArgs, getTargettedDbClients } from '@/modules/cli/commands/db/helpers'
import { CommandModule } from 'yargs'

const command: CommandModule<unknown, { times: number } & CommonDbArgs> = {
  command: 'down [times]',
  describe: 'Undo last migration',
  builder: {
    times: {
      type: 'number',
      default: 1,
      describe: 'Number of migrations to undo'
    }
  },
  async handler(argv) {
    const { times, regionKey } = argv
    const howManyTimes = times || 1

    logger.info(
      howManyTimes === 1
        ? 'Undoing last migration...'
        : `Undoing last ${howManyTimes} migrations...`
    )

    const dbs = await getTargettedDbClients({ regionKey })
    for (const db of dbs) {
      logger.info(`Migrating DB ${db.regionKey}...`)
      for (let i = 0; i < howManyTimes; i++) {
        await db.client.migrate.down()
      }
    }

    logger.info('Completed!')
  }
}

export = command
