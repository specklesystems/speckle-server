/** @type {import('yargs').CommandModule} */
const command = {
  command: 'migrate',
  describe: 'Migration specific commands',
  builder(yargs) {
    return yargs.commandDir('migrate').demandCommand()
  }
}

module.exports = command
