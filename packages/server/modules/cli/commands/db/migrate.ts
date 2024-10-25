import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'migrate',
  describe: 'Migration specific commands',
  builder(yargs) {
    return yargs.commandDir('migrate', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
