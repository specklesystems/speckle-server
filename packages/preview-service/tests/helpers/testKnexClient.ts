/* eslint-disable camelcase */
import { knex } from 'knex'

export const getTestDb = (databaseName?: string) =>
  knex({
    client: 'pg',
    connection: {
      application_name: 'speckle_preview_service',
      database: databaseName,
      user: 'preview_service_test',
      password: 'preview_service_test',
      host: '127.0.0.1',
      port: 5432,
      protocol: 'postgres'
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
