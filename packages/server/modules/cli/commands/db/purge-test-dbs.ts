import { cliLogger as logger } from '@/observability/logging'
import {
  getTargettedDbClients,
  type CommonDbArgs
} from '@/modules/cli/commands/db/helpers'
import type { CommandModule } from 'yargs'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { BaseError } from '@/modules/shared/errors'
import { ensureError } from '@speckle/shared'
import { resetPubSubFactory } from '@/test/hooks'
import { mainDb } from '@/db/knex'

const command: CommandModule<unknown, CommonDbArgs> = {
  command: 'purge-test-dbs',
  describe:
    'When rollbacks fail, use this to forcefully purge test DBs (drop all tables)',
  builder(yargs) {
    return yargs.option('regionKey', {
      type: 'string',
      describe:
        'Region key to run migrations for. If not set, will run on all registered DBs. If set to "main", will only run in main DB. Can be comma-delimited.'
    })
  },
  async handler(argv) {
    const { regionKey } = argv
    if (!isTestEnv()) {
      throw new Error('You should only ever run this w/ NODE_ENV=test')
    }

    logger.info('Running latest migrations on DB instances!', {
      regionKey: regionKey || 'all'
    })
    const dbs = await getTargettedDbClients({ regionKey }).catch((err) => {
      const e = ensureError(err)
      if (e.message.includes('does not exist')) {
        logger.warn(
          'No tables for region resolution found, falling back to just the main DB...'
        )

        // Expected - tables could already be dropped, lets just use core DB
        return [{ client: mainDb, regionKey: 'main', isMain: true }]
      }

      throw err
    })

    // Sort DBs, do main last
    dbs.sort((a, b) => {
      if (a.isMain && !b.isMain) return 1
      if (!a.isMain && b.isMain) return -1
      return 0
    })

    for (const db of dbs) {
      logger.info(`Purging test DB ${db.regionKey}...`)
      try {
        // Attempt to reset pubsub, swallowing issues
        await resetPubSubFactory({ db: db.client })().catch((err) => {
          logger.warn(`Failed to reset pubsub for ${db.regionKey}`, {
            cause: ensureError(err)
          })
        })

        // Find and drop all tables
        const tables = await db.client.raw(
          'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
          ['public']
        )
        const tableNames = tables.rows.map(
          (row: { table_name: string }) => row.table_name
        )
        logger.info(`Dropping tables: ${tableNames.join(', ')}`, {
          regionKey: db.regionKey
        })

        await db.client.raw('SET session_replication_role = replica') // disables FK constraints
        for (const tableName of tableNames) {
          await db.client.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
        }

        logger.info(`Successfully purged test DB ${db.regionKey}`)
      } catch (error) {
        throw new BaseError(`Failed to purge test DB ${db.regionKey}`, {
          cause: ensureError(error)
        })
      } finally {
        await db.client
          .raw('SET session_replication_role = DEFAULT')
          .catch(logger.error)
      }
    }
  }
}

export = command
