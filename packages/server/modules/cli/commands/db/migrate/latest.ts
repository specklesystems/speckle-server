import knex from '@/db/knex'
import { logger } from '@/logging/logging'
import { getRegisteredRegionClients } from '@/modules/multiregion/dbSelector'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { mochaHooks } from '@/test/hooks'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'latest',
  describe: 'Run all migrations that have not yet been run',
  async handler() {
    logger.info('Running latest migration...')

    // In tests we want different logic - just run beforeAll
    if (isTestEnv()) {
      // Run before hooks, to properly initialize everything
      await (mochaHooks.beforeAll as () => Promise<void>)()
    } else {
      const regionDbs = await getRegisteredRegionClients()
      const dbs = [knex, ...Object.values(regionDbs)]
      for (const db of dbs) {
        await db.migrate.latest()
      }
    }

    logger.info('Completed running migration')
  }
}

export = command
