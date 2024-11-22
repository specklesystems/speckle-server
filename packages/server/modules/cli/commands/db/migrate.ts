import { noop } from 'lodash'
import { CommandModule } from 'yargs'

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
  },
  handler: noop
}

export = command
