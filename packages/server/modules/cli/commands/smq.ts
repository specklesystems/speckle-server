import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'smq',
  describe: 'Redis SMQ related activities',
  builder(yargs) {
    return yargs.commandDir('smq', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
