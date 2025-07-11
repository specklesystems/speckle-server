import { noop } from 'lodash-es'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'activities',
  describe: 'Activity related operations',
  builder(yargs) {
    return yargs.commandDir('activities', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
