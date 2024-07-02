/* eslint-disable camelcase */

import knexClient from 'knex'
import { getPostgresConnectionString } from '@/utils/env'

const knex = knexClient({
  client: 'pg',
  connection: {
    application_name: 'speckle_preview_service',
    connectionString: getPostgresConnectionString()
  },
  pool: { min: 0, max: 2 }
  // migrations are managed in the server package
})

export default knex
