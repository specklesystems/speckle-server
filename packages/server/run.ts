/* eslint-disable no-restricted-imports */
import './bootstrap'
import { init, startHttp } from './app'
import { logger } from './observability/logging'

init()
  .then(({ app, graphqlServer, registers, server, readinessCheck }) =>
    startHttp({ app, graphqlServer, registers, server, readinessCheck })
  )
  .catch((err) => {
    logger.error(err, 'Failed to start server. Exiting with non-zero exit code...')

    // kill it with fire 🔥
    process.exit(1)
  })

// 💥
