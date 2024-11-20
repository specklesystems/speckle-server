import knex from '@/db/knex'
import { logger } from '@/logging/logging'
import { getRegisteredRegionClients } from '@/modules/multiregion/dbSelector'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { mochaHooks, resetPubSubFactory } from '@/test/hooks'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'rollback',
  describe: 'Roll back all migrations',
  async handler() {
    logger.info('Rolling back migrations...')

    if (isTestEnv()) {
      // Run before hooks, to properly initialize everything first
      await (mochaHooks.beforeAll as () => Promise<void>)()
    }

    const regionDbs = await getRegisteredRegionClients()
    const dbs = [knex, ...Object.values(regionDbs)]

    for (const db of dbs) {
      const resetPubSub = resetPubSubFactory({ db })
      await resetPubSub()
      await db.migrate.rollback(undefined, true)
    }

    logger.info('Completed rolling back migrations')
  }
}

export = command
