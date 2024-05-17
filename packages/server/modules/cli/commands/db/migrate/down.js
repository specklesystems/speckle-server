const knex = require('@/db/knex')
const { logger } = require('@/logging/logging')

/** @type {import('yargs').CommandModule} */
const command = {
  command: 'down [times]',
  describe: 'Undo last migration',
  builder(yargs) {
    return yargs.positional('times', {
      describe: 'Number of migrations to undo',
      type: 'number',
      default: 1
    })
  },
  async handler(argv) {
    const howManyTimes = argv.times || 1

    logger.info(
      howManyTimes === 1
        ? 'Undoing last migration...'
        : `Undoing last ${howManyTimes} migrations...`
    )

    for (let i = 0; i < howManyTimes; i++) {
      await knex.migrate.down()
    }

    logger.info('Completed!')
  }
}

module.exports = command
