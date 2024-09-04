import { getPostgresConnectionString, getPostgresMaxConnections } from '@/utils/env.js'
import * as knex from 'knex'
import { get } from 'lodash-es'

// CJS interop (types are off)
const knexBuilder = (get(knex, 'default') ||
  get(knex, 'knex')) as unknown as typeof knex.knex

export const db = knexBuilder({
  client: 'pg',
  connection: {
    // eslint-disable-next-line camelcase
    application_name: 'speckle_preview_service',
    connectionString: getPostgresConnectionString()
  },
  pool: {
    min: 0,
    max: getPostgresMaxConnections(),
    acquireTimeoutMillis: 16000, //allows for 3x creation attempts plus idle time between attempts
    createTimeoutMillis: 5000
  }
  // migrations are managed in the server package
})
