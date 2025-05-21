import { noop } from 'lodash-es'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'download',
  describe: 'Download data from other Speckle server instances (e.g. latest or xyz)',
  builder(yargs) {
    return yargs.commandDir('download', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export default command
