import { mainDb } from '@/db/knex'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import type {
  EmitArg,
  EventBus,
  EventBusEmit
} from '@/modules/shared/services/eventBus'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import type { MaybeAsync } from '@speckle/shared'
import type { Knex } from 'knex'
import { isBoolean } from 'lodash-es'
import type { Logger } from 'pino'

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
