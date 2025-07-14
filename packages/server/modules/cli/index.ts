/* eslint-disable no-restricted-imports */
import '../../bootstrap.js'
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { cliLogger as logger } from '@/observability/logging'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { beforeEntireTestRun } from '@/test/hooks'
import { getModuleDirectory } from '@speckle/shared/environment/node'

const main = async () => {
  await yargs(hideBin(process.argv))
    .scriptName('yarn cli')
    .usage('$0 <cmd> [args]')
    .commandDir(path.resolve(getModuleDirectory(import.meta), './commands'), {
      extensions: ['js', 'ts']
    })
    .option('beforeAll', {
      type: 'boolean',
      default: false,
      describe: 'Run beforeAll hooks before running migrations, if in test mode'
    })
    .demandCommand()
    .middleware(async (argv) => {
      // If beforeAll set, run beforeAll
      const isBeforeAllSet = !!argv.beforeAll

      // In test env, run beforeAll hooks to properly initialize everything first
      if (isBeforeAllSet && isTestEnv()) {
        logger.info('Running test beforeAll hooks...')
        await beforeEntireTestRun()
      }
    })
    .fail((msg, err, yargs) => {
      if (!err) {
        // If validation error (no err instance) then just show help and show the message
        console.log(yargs.help())
        console.log('\n', msg)
      } else {
        // If actual app error occurred, show the msg, but don't show help info
        logger.error(err)
        console.log('\n', 'Specify --help for available options')
      }

      process.exit(1)
    })
    .help()
    .parseAsync()

  process.exit(0)
}

await main()
