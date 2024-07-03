/* eslint-disable camelcase */
import { knex } from 'knex'
// import path from 'path'

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
    // migrations are managed in the server package for production, but managed here for tests
    // migrations: {
    //   directory: path.resolve(__dirname, '../migrations'),
    //   loadExtensions: ['.ts']
    // }
  })
