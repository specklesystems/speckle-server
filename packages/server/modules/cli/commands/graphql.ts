import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'graphql',
  describe: 'GraphQL actions - dumping schema to file etc.',
  builder(yargs) {
    return yargs.commandDir('graphql', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
