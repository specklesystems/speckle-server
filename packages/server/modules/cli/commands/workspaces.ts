import { noop } from 'lodash-es'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'workspaces',
  describe: 'Various workspace related actions',
  builder(yargs) {
    return yargs.commandDir('workspaces', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
