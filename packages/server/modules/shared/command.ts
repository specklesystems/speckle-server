import { db, mainDb } from '@/db/knex'
import {
  commitPreparedTransaction,
  numberOfFreeConnections,
  prepareTransaction,
  rollbackPreparedTransaction,
  withTransaction
} from '@/modules/shared/helpers/dbHelper'
import type {
  EmitArg,
  EventBus,
  EventBusEmit
} from '@/modules/shared/services/eventBus'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import type { MaybeAsync } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'
import { isBoolean } from 'lodash-es'
import type { Logger } from 'pino'
import { wasRejected } from '@/modules/shared/domain/constants'
import { RegionalTransactionFatalError } from '@/modules/shared/errors'

/**
 * @deprecated asOperation does this and more. Also many usages of commandFactory are broken
 * in the sense that they're not actually using the transaction correctly
 */
export const commandFactory =
  <TOperation extends (...args: Parameters<TOperation>) => ReturnType<TOperation>>({
    db,
    eventBus,
    operationFactory
  }: {
    db: Knex
    eventBus?: EventBus
    operationFactory: (arg: { db: Knex; trx: Knex; emit: EventBusEmit }) => TOperation
  }) =>
  async (...args: Parameters<TOperation>): Promise<Awaited<ReturnType<TOperation>>> => {
    const events: EmitArg[] = []
    const emit: EventBusEmit = async ({ eventName, payload }) => {
      events.push({ eventName, payload })
    }

    const trx = await db.transaction()
    try {
      const result = await operationFactory({ db, trx, emit })(...args)

      await trx.commit()
      if (eventBus) {
        for (const event of events) {
          await eventBus.emit(event)
        }
      }
      return result as Awaited<ReturnType<TOperation>>
    } catch (err) {
      trx.rollback()
      throw err
    }
  }

/**
 * Adds logging & transaction support to an operation
 */
export const asOperation = async <T>(
  operation: (args: { db: Knex; emit: EventBusEmit }) => MaybeAsync<T>,
  params: {
    name: string
    logger: Logger
    description?: string
    /**
     * Defaults to main DB
     */
    db?: Knex
    /**
     * Defaults to main event bus
     */
    eventBus?: EventBus
    /**
     * Whether to treat the operation as a transaction. That makes the injected DB a knex transaction
     * and also collects eventBus events to be emitted at the end of the operation.
     *
     * Can be a bool or an obj describing how the trx should be set up
     */
    transaction?:
      | boolean
      | {
          db: true // db trx can't be turned off, only the eventBus trx can
          eventBus: boolean
        }
  }
): Promise<T> => {
  const {
    db = mainDb,
    eventBus = getEventBus(),
    logger,
    name,
    description,
    transaction
  } = params

  return await withOperationLogging(
    async () => {
      if (!transaction) {
        return await operation({ db, emit: eventBus.emit })
      }

      const events: EmitArg[] = []
      const emit: EventBusEmit = async ({ eventName, payload }) => {
        events.push({ eventName, payload })
      }
      const trxRet = await withTransaction(
        async ({ trx }) => {
          const useEmitTrx = isBoolean(transaction) ? transaction : transaction.eventBus

          return await operation({ db: trx, emit: useEmitTrx ? emit : eventBus.emit })
        },
        { db }
      )
      for (const event of events) {
        await eventBus.emit(event)
      }

      return trxRet
    },
    {
      logger,
      operationName: name,
      operationDescription: description
    }
  )
}

export const asMultiregionalOperation = async <T, K extends [Knex, ...Knex[]]>(
  [main, ...regions]: K,
  operation: (args: {
    dbs: Knex[]
    main: Knex
    regions: Knex[]
    emit: EventBusEmit
  }) => MaybeAsync<T>,
  params: {
    name: string
    logger: Logger
    description?: string
    /**
     * Defaults to main event bus
     */
    eventBus?: EventBus
  }
): Promise<T> => {
  const { eventBus = getEventBus(), logger, name, description } = params

  return await withOperationLogging(
    async () => {
      const events: EmitArg[] = []
      const emit: EventBusEmit = async ({ eventName, payload }) => {
        events.push({ eventName, payload })
      }

      const gid = cryptoRandomString({ length: 10 })
      const txs: Knex.Transaction[] = []

      const rollback = async () => {
        await Promise.allSettled(txs.map((tx) => rollbackPreparedTransaction(tx, gid)))
        const a = await Promise.allSettled(txs.map((tx) => tx.rollback()))
        console.log('rollback res', a)
      }

      const printConnections = () => {
        // DEBUG: DELETE!
        const a = (k: Knex) => ({
          free: numberOfFreeConnections(k),
          pool: {
            free: k.client.pool.numFree(),
            used: k.client.pool.numUsed(),
            aq: k.client.pool.numPendingAcquires(),
            cr: k.client.pool.numPendingCreates(),
            val: k.client.pool.numPendingValidations()
          }
        })

        const t = {}
        for (const db of [main, ...regions]) {
          // @ts-expect-error remove plis
          t[`${db.client.connectionSettings.connectionString}`] = a(db)
        }
        console.log(t)
      }

      let result
      try {
        const mainTx = await main.transaction()
        txs.push(mainTx)

        const regionTxs: Knex.Transaction[] = []
        for (const region of regions) {
          const regionTx = await region.transaction()
          txs.push(regionTx)
          regionTxs.push(regionTx)
        }

        result = await operation({
          dbs: txs,
          main: mainTx,
          regions: regionTxs,
          emit
        })

        // Every transaction is prepared
        // - important to do prepare sequentially
        // - if a query won't complete, every preparedTransaction is rollbacked (from prepared or unprepared)
        // - this applies a lock on the rows to be updated to assure that the commit will succeed.
        // - the transactions once prepared, gets written to disk db and is no longer scoped to the connection.
        // - this last part knex does not handle well, so no matter what, we need to rollback/commit
        // the transaction (the prepared one and the connection transaction) that's why it's wrapped in a transaction block
        for (const tx of txs) {
          await prepareTransaction(tx, gid)
          await db.client.releaseConnection(tx)
        }
      } catch (e) {
        console.log('rollback!')
        await rollback()
        printConnections()
        throw e
      }

      const commits = await Promise.allSettled(
        txs.map(async (tx) => {
          await commitPreparedTransaction(tx, gid)
          try {
            await tx.commit()
          } catch {
            // forcing knex to release connection
            // for the db this tx is gone already as its in a prepared state unbinded from the connection
            // but knex does not know this, and it won't release the connection until a commit/rollback happen
          }
        })
      )

      if (commits.some(wasRejected)) {
        // we never should reach this point
        // as once a transaction is prepared successfully
        // it will commit

        logger.error(
          { commits, gid },
          `Failed to commit transactions in 2PC operation.`
        )

        printConnections()

        throw new RegionalTransactionFatalError(
          'Failed some or all transactions in 2PC operation.',
          { clients: txs, gid }
        )
      }

      for (const event of events) {
        await eventBus.emit(event)
      }

      console.log('end!')
      printConnections()
      return result
    },
    {
      logger,
      operationName: name,
      operationDescription: description
    }
  )
}
