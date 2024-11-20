import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { noop } from 'lodash'
import { CommandModule } from 'yargs'
import { mochaHooks } from '@/test/hooks'
import { cliLogger } from '@/logging/logging'

const command: CommandModule = {
  command: 'migrate',
  describe: 'Migration specific commands',
  builder(yargs) {
    return yargs
      .commandDir('migrate', { extensions: ['js', 'ts'] })
      .demandCommand()
      .option('regionKey', {
        type: 'string',
        describe:
          'Region key to run migrations for. If not set, will run on all registered DBs. If set to "main", will only run in main DB. Can be comma-delimited.'
      })
      .option('beforeAll', {
        type: 'boolean',
        default: false,
        describe: 'Run beforeAll hooks before running migrations, if in test mode'
      })
      .middleware(async (argv) => {
        // If beforeAll set, run beforeAll
        const isBeforeAllSet = !!argv.beforeAll

        // In test env, run beforeAll hooks to properly initialize everything first
        if (isBeforeAllSet && isTestEnv()) {
          cliLogger.info('Running test beforeAll hooks...')
          await (mochaHooks.beforeAll as () => Promise<void>)()
        }
      })
  },
  handler: noop
}

export = command
