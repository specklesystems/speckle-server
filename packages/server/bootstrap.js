import dotenv from 'dotenv'
import {
  isTestEnv,
  isDevEnv,
  isApolloMonitoringEnabled,
  getApolloServerVersion,
  getServerVersion
} from '@/modules/shared/helpers/envHelper'
import { logger } from '@/logging/logging'
import { initOpenTelemetry } from '@/observability/otel'
import { patchKnex } from '@/modules/core/patches/knex'
import { appRoot, packageRoot } from '#/root.js'

/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */

// Initializing env vars
if (isApolloMonitoringEnabled() && !getApolloServerVersion()) {
  process.env.APOLLO_SERVER_USER_VERSION = getServerVersion()
}

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (isTestEnv()) {
  const { error } = dotenv.config({ path: `${packageRoot}/.env.test` })
  if (error) {
    const e = new Error(
      'Attempting to run tests without an .env.test file properly set up! Check readme!'
    )
    logger.error(e)
    process.exit(1)
  }
}

// Custom inspector init, when debugging doesn't work any other way
// (e.g. due to various child processes capturing the --inspect flag)
const startDebugger = process.env.START_DEBUGGER
if ((isTestEnv() || isDevEnv()) && startDebugger) {
  const inspector = require('node:inspector')
  if (!inspector.url()) {
    console.log('Debugger starting on process ' + process.pid)
    inspector.open(0, undefined, true)
  }
}

dotenv.config({ path: `${packageRoot}/.env` })

// knex is a singleton controlled by module so can't wait til app init
initOpenTelemetry()
patchKnex()

export { appRoot, packageRoot }
