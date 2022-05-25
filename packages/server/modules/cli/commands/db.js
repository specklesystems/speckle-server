/** @type {import('yargs').CommandModule} */
const command = {
  command: 'db',
  describe: 'DB actions - migrations, seeding',
  builder(yargs) {
    return yargs.commandDir('db').demandCommand()
  }
}

module.exports = command
