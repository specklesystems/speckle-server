/* eslint-disable camelcase */
import { knex } from 'knex'
import { customizePostgresConnectionString } from '#/helpers/helpers.js'

export const getTestDb = (databaseName?: string) =>
  knex({
    client: 'pg',
    connection: {
      application_name: 'speckle_preview_service',
      connectionString: customizePostgresConnectionString(databaseName)
    },
    pool: { min: 0, max: 2 }
    // migrations are managed in the server package for production
    // for tests, we are creating a new database for each test run so we can't use this default migration functionality
    // migrations: {
    //   extension: '.ts',
    //   directory: path.resolve(__dirname, '../migrations'),
    //   loadExtensions: ['js', 'ts']
    // }
  })
