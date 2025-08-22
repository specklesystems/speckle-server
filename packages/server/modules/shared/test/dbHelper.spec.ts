import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { Scopes } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import type { Knex } from 'knex'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import { db } from '@/db/knex'
import { sleep } from '@/test/helpers'
import { asMultiregionalOperation } from '@/modules/shared/command'
import { testLogger } from '@/observability/logging'

isMultiRegionTestMode()
  ? describe('Prepared transaction utils (2PC) @multiregion', async () => {
      let main: Knex
      let region1: Knex
      let region2: Knex
      let ALL_DBS: [Knex, ...Knex[]] = [db]

      const testOperationFactory =
        ({ db }: { db: Knex }) =>
        async (payload: {
          name: string
          description: string
          public: boolean
        }): Promise<void> => {
          await db(Scopes.name).insert(payload)
        }

      before(async () => {
        main = db
        region1 = await getDb({ regionKey: 'region1' })
        region2 = await getDb({ regionKey: 'region2' })
        ALL_DBS = [main, region1, region2]
      })

      it('successfully replicates operation across all specified db instances', async () => {
        const testOperationParams = {
          name: 'test:scope:a',
          description: 'for test purposes only',
          public: false
        }

        await asMultiregionalOperation(
          ALL_DBS,
          ({ dbs }) =>
            Promise.all(
              dbs.map((d) => testOperationFactory({ db: d })(testOperationParams))
            ),
          {
            name: 'testing regional success',
            logger: testLogger
          }
        )

        const scopeMain = await main
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion1 = await region1
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion2 = await region2
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()

        expect(scopeMain).to.deep.eq(testOperationParams)
        expect(scopeMain).to.deep.equal(scopeRegion1)
        expect(scopeMain).to.deep.equal(scopeRegion2)
      })

      it('rolls back when one node fails on write', async () => {
        // Create scope before replicated query
        const testOperationParams = {
          name: 'test:scope:b',
          description: 'for test purposes only',
          public: false
        }

        await testOperationFactory({ db: region2 })(testOperationParams)

        const promise = asMultiregionalOperation(
          ALL_DBS,
          ({ dbs }) =>
            Promise.all(
              dbs.map((d) => testOperationFactory({ db: d })(testOperationParams))
            ),
          {
            name: 'testing regional failure',
            logger: testLogger
          }
        )
        await expect(promise).eventually.to.be.rejected

        const scopeMain = await main
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion1 = await region1
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion2 = await region2
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()

        expect(scopeMain).to.be.undefined
        expect(scopeRegion1).to.be.undefined
        expect(scopeRegion2).to.exist
      })

      it('rolls back all commits in case of one node failure on transaction', async () => {
        const testOperationParams = {
          name: 'test:scope:c',
          description: 'for test purposes only',
          public: false
        }

        const dbThatFails = {
          transaction: async () => Promise.reject(new Error('Transaction failed'))
        } as unknown as Knex

        const promise = asMultiregionalOperation(
          [...ALL_DBS, dbThatFails],
          ({ dbs }) =>
            Promise.all(
              dbs.map((d) => testOperationFactory({ db: d })(testOperationParams))
            ),
          {
            name: 'testing regional success',
            logger: testLogger
          }
        )

        await expect(promise).to.eventually.be.rejected

        const scopeMain = await main
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion1 = await region1
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()
        const scopeRegion2 = await region2
          .table(Scopes.name)
          .where({ name: testOperationParams.name })
          .first()

        expect(scopeMain).to.be.undefined
        expect(scopeRegion1).to.be.undefined
        expect(scopeRegion2).to.be.undefined
      })

      it('should not overwhelm the connection pool', async () => {
        const connectionsUsedBefore = main.client.pool.numUsed()

        const oneKnexInstanceCall = async () => {
          const { buildBasicTestUser, createTestUsers } = await import(
            '@/test/authHelper'
          )

          const user = buildBasicTestUser()
          await createTestUsers([user, user]) // This uses the asOperation helper
        }

        const manyWeirdKnexInstanceCalls = async () => {
          await Promise.allSettled(Array.from({ length: 100 }, oneKnexInstanceCall))
        }

        await manyWeirdKnexInstanceCalls()
        await sleep(1000) // just in case

        const connectionsUsedAfter = main.client.pool.numUsed()

        expect(connectionsUsedAfter).to.be.lte(connectionsUsedBefore)
      })
    })
  : null
