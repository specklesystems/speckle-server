const { getMaximumNumberOfConnections } = require('../env')
const knex = require('../knex')
const { logger } = require('../observability/logging')

const run = async () => {
  const numberOfJobs = 200
  logger.info(
    `Starting workload. The maximum number of connections we can create is ${getMaximumNumberOfConnections()}. The number of jobs we will create is ${numberOfJobs}.`
  )
  const allQueries = []
  for (let i = 0; i < numberOfJobs; i++) {
    allQueries.push(knex.raw('SELECT clock_timestamp(), pg_sleep(5);'))
  }
  await Promise.all(allQueries)
  logger.info('Done')

  // recursively call this function again in 30 seconds
  setTimeout(run, 60000)
}

module.exports = { run }
