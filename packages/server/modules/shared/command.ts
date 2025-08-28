import { mainDb } from '@/db/knex'
import {
  commitPreparedTransaction as commitPrepared,
  prepareTransaction,
  rollbackPreparedTransaction as rollbackPrepared,
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

/**
 * Utility function to execute a command across multiple regions
 * works similarly to asOperation, but provides references to every db instance in the dbs array provided
 * It opens a transaction for each db, and uses 2PC to ensure consistency at commit moment
 * txs represents all the transactions
 * dbTx represents the main transaction (Knex)
 * regionTxs represents the transactions that were given as regions (Knex[])
 */
export const asMultiregionalOperation = async <T, K extends [Knex, ...Knex[]]>(
  operation: (args: {
    /**
     * @description reference to all dbs involved in the operation
     */
    allDbs: Knex[]
    /**
     * @description reference to the main db (first one passed in the array)
     */
    mainDb: Knex
    /**
     * @description reference for second db (first one not main)
     */
    regionDb: Knex
    /**
     * @description reference for all regions (all dbs except the main one)
     */
    regionDbs: Knex[]
    emit: EventBusEmit
  }) => MaybeAsync<T>,
  params: {
    name: string
    logger: Logger
    description?: string
    /**
     * @description Dbs to open transactions for the operation
     */
    dbs: K
    /**
     * @description Defaults to main event bus
     */
    eventBus?: EventBus
  }
): Promise<T> => {
  const {
    eventBus = getEventBus(),
    logger,
    name,
    description,
    dbs: [mainDb, ...regionDbs]
  } = params

  const totalDbs = [mainDb, ...regionDbs]
  if (totalDbs.length === 1) {
    // no need for 2pc, normal transaction is applied
    return await asOperation(
      ({ db, emit }) =>
        operation({
          allDbs: [db],
          mainDb: db,
          regionDb: db,
          regionDbs: [],
          emit
        }),
      {
        name,
        description,
        logger,
        eventBus,
        db: totalDbs[0],
        transaction: true
      }
    )
  }

  return await withOperationLogging(
    async () => {
      const events: EmitArg[] = []
      const emit: EventBusEmit = async ({ eventName, payload }) => {
        events.push({ eventName, payload })
      }

      const gid = cryptoRandomString({ length: 10 })
      const trxs: Knex.Transaction[] = []

      const rollback = async () => {
        await Promise.allSettled(trxs.map((trx) => rollbackPrepared(trx, gid)))
        await Promise.allSettled(trxs.map((trx) => trx.rollback()))
      }

      let result
      try {
        const mainDbTx = await mainDb.transaction()
        trxs.push(mainDbTx)

        const regionDbsTx: Knex.Transaction[] = []
        for (const regionDb of regionDbs) {
          const regionTx = await regionDb.transaction()
          trxs.push(regionTx)
          regionDbsTx.push(regionTx)
        }

        result = await operation({
          mainDb: mainDbTx,
          allDbs: trxs,
          regionDb: regionDbsTx[0],
          regionDbs: regionDbsTx,
          emit
        })

        // Every transaction is prepared
        // - important to do prepare sequentially
        // - if a query won't complete, every preparedTransaction is rollbacked (from prepared or unprepared)
        // - this applies a lock on the rows to be updated to assure that the commit will succeed.
        // - the transactions once prepared, gets written to disk db and is no longer scoped to the connection.
        // - this last part knex does not handle well, so no matter what, we need to rollback/commit
        // the transaction (the prepared one and the connection transaction) that's why it's wrapped in a transaction block
        for (const tx of trxs) await prepareTransaction(tx, gid)
      } catch (e) {
        await rollback()
        throw e
      }

      const commits = await Promise.allSettled(
        trxs.map(async (trx) => {
          await commitPrepared(trx, gid)
          try {
            await trx.commit()
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

        throw new RegionalTransactionFatalError(
          'Failed some or all transactions in 2PC operation.',
          { clients: trxs, gid }
        )
      }

      for (const event of events) await eventBus.emit(event)

      return result
    },
    {
      logger,
      operationName: name,
      operationDescription: description
    }
  )
}
