import { noop } from 'lodash'
import { CommandModule } from 'yargs'

const command: CommandModule = {
  command: 'db',
  describe: 'DB actions - migrations, seeding',
  builder(yargs) {
    return yargs.commandDir('db', { extensions: ['js', 'ts'] }).demandCommand()
  },
  handler: noop
}

export = command
