import { getPostgresConnectionString } from '#src/utils/env.js'
import knexPkg from 'knex'
const { knex } = knexPkg

export const db = knex({
  client: 'pg',
  connection: {
    // eslint-disable-next-line camelcase
    application_name: 'speckle_preview_service',
    connectionString: getPostgresConnectionString()
  },
  pool: { min: 0, max: 2 }
  // migrations are managed in the server package
})
