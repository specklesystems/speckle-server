import { EmitArg, EventBus, EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'

/**
 * TODO: Fix api - make operationFactory db arg actually return the trx. Currently many usages of this
 * are not working correctly cause they just use the db, skipping the transaction
 *
 * Also: withOperationLogging and withOperationTransaction could all be merged into this, with
 * this having a better name like `operationFactory`
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
