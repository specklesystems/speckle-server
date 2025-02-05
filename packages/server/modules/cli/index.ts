/* eslint-disable no-restricted-imports */
import path from 'path'
import yargs from 'yargs'
import '../../bootstrap'
import { cliLogger, logger } from '@/logging/logging'
import { isTestEnv } from '@/modules/shared/helpers/envHelper'
import { mochaHooks } from '@/test/hooks'

const main = async () => {
  const execution = yargs
    .scriptName('yarn cli')
    .usage('$0 <cmd> [args]')
    .commandDir(path.resolve(__dirname, './commands'), { extensions: ['js', 'ts'] })
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
        cliLogger.info('Running test beforeAll hooks...')
        await (mochaHooks.beforeAll as () => Promise<void>)()
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
    .help().argv

  return execution
}

main().then(() => {
  // weird TS typing issue
  yargs.exit(0, undefined as unknown as Error)
})
