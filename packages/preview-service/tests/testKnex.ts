/* eslint-disable camelcase */
import { knex } from 'knex'

export const getTestDb = () =>
  knex({
    client: 'pg',
    connection: {
      application_name: 'speckle_preview_service',
      connectionString:
        'postgres://preview_service_test:preview_service_test@127.0.0.1/preview_service_test'
    },
    pool: { min: 0, max: 2 },
    // migrations are managed in the server package for production, but managed here for tests
    migrations: {
      directory: './tests/migrations'
    }
  })
