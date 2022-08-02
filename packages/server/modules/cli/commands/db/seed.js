/** @type {import('yargs').CommandModule} */
const command = {
  command: 'seed',
  describe: 'Seed your local DB with fake data',
  builder(yargs) {
    return yargs.commandDir('seed').demandCommand()
  }
}

module.exports = command
