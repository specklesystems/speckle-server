import { noop } from 'lodash-es'
import type { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'bull',
  describe: 'Bull MQ related activities',
  builder(yargs) {
    return yargs.commandDir('bull', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
