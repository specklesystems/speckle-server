import { expect } from 'chai'
import { db } from '@/db/knex'
import { areAllPostgresAlive, isPostgresAlive } from '@/healthchecks/postgres'
import knex from 'knex'

describe('Healthchecks @healthchecks', () => {
  describe('Postgres @postgres', () => {
    describe('isPostgresAlive', () => {
      it('should return true if the database is alive', async () => {
        // db is the primary database. We are making an assumption that it is always alive.
        const result = await isPostgresAlive({ db })
        expect(result.isAlive).to.be.true
      })
      it('should return false if the database is not alive', async () => {
        const knexClient = knex({
          client: 'pg',
          connection: {
            connectionString:
              'postgres://user_does_not_exist:password@127.0.0.1/this_db_does_not_exist'
          }
        })
        const result = await isPostgresAlive({ db: knexClient })
        if (result.isAlive) {
          expect(result.isAlive).to.be.false
          throw new Error('Unexpected condition') // HACK to force correct typing
        }
        expect(result.err).to.be.an('error')
      })
    })
    describe('areAllPostgresAlive', () => {
      it('should return true if all databases are alive', async () => {
        const result = await areAllPostgresAlive()
        expect(Object.values(result).every((r) => r.isAlive)).to.be.true
      })
      it.skip('should return false if any database is not alive', async () => {
        //TODO implementation of this test requires a little refactoring of the code
        //to allow for a database to be temporarily unavailable, probably via dependency injection of the clients
      })
    })
  })
})
