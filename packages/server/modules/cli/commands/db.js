/** @type {import('yargs').CommandModule} */
const command = {
  command: 'db',
  describe: 'DB & Migration actions',
  builder(yargs) {
    return yargs.commandDir('db').demandCommand()
  }
}

module.exports = command
