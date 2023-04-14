import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'test',
  describe: 'Various test actions for random testing during development',
  builder(yargs) {
    return yargs.commandDir('test', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
