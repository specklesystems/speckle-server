const knex = require('../knex')
const { logger } = require('../observability/logging')

const run = async () => {
  const allQueries = []
  for (let i = 0; i < 50; i++) {
    allQueries.push(
      knex.raw('SELECT clock_timestamp(), pg_sleep(5), clock_timestamp();')
    )
  }
  await Promise.all(allQueries)
  logger.info('Done')
}

module.exports = { run }
