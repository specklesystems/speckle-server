import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'stream',
  describe: 'Work with local streams/projects',
  builder(yargs) {
    return yargs.commandDir('stream', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
