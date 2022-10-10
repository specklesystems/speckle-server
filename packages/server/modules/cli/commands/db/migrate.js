/** @type {import('yargs').CommandModule} */
const command = {
  command: 'migrate',
  describe: 'Migration specific commands',
  builder(yargs) {
    return yargs.commandDir('migrate', { extensions: ['js', 'ts'] }).demandCommand()
  }
}

module.exports = command
