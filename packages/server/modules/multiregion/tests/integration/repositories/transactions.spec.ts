import type { Knex } from 'knex'
import { db } from '@/db/knex'
import { getStalePreparedTransactionsFactory } from '@/modules/multiregion/repositories/transactions'
import {
  prepareTransaction,
  rollbackPreparedTransaction
} from '@/modules/shared/helpers/dbHelper'
import { wait } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'

isMultiRegionTestMode()
  ? describe('prepared transaction repository functions @multiregion', () => {
      describe('getStalePreparedTransactionsFactory returns a function, that', () => {
        let trx: Knex.Transaction
        let transactionId: string = ''

        beforeEach(async () => {
          trx = await db.transaction()
          transactionId = cryptoRandomString({ length: 10 })

          await prepareTransaction(trx, transactionId)
          try {
            await trx.commit()
          } catch {}
        })

        afterEach(async () => {
          await rollbackPreparedTransaction(db, transactionId)
          try {
            await trx.rollback()
          } catch {}
        })

        it('returns prepared transactions older than a given time interval', async () => {
          await wait(2000)
          const result = await getStalePreparedTransactionsFactory({ db })({
            interval: '1 second'
          })
          expect(result.length).to.equal(1)
          expect(result.at(0)?.gid).to.equal(transactionId)
        })

        it('does not return recently prepared transactions', async () => {
          const result = await getStalePreparedTransactionsFactory({ db })({})
          expect(result.length).to.equal(0)
        })
      })
    })
  : null
