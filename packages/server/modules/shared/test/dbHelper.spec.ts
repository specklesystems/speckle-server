import { getDb } from '@/modules/multiregion/utils/dbSelector'
import { Scopes } from '@/modules/core/dbSchema'
import { expect } from 'chai'
import type { Knex } from 'knex'
import { replicateQuery } from '@/modules/shared/helpers/dbHelper'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'

isMultiRegionTestMode()
  ? describe('Prepared transaction utils (2PC) @multiregion', async () => {
      let main: Knex
      let region1: Knex
      let region2: Knex
      let ALL_DBS: Knex[] = []

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
        main = await getDb({ regionKey: null })
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

        await replicateQuery(ALL_DBS, testOperationFactory)(testOperationParams)

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

        const promise = replicateQuery(
          ALL_DBS,
          testOperationFactory
        )(testOperationParams)

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
          transaction: () =>
            Promise.resolve(() => ({
              insert: () => Promise.resolve()
            })) // will fail on raw call
        } as unknown as Knex

        const promise = replicateQuery(
          [...ALL_DBS, dbThatFails],
          testOperationFactory
        )(testOperationParams)

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
    })
  : null
