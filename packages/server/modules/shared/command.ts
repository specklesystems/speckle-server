import { EmitArg, EventBus, EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'

export const commandFactory =
  <TOperation extends (...args: Parameters<TOperation>) => ReturnType<TOperation>>({
    db,
    eventBus,
    operationFactory
  }: {
    db: Knex
    eventBus: EventBus
    operationFactory: (arg: { db: Knex; emit: EventBusEmit }) => TOperation
  }) =>
  async (...args: Parameters<TOperation>): Promise<Awaited<ReturnType<TOperation>>> => {
    const trx = await db.transaction()

    const events: EmitArg[] = []
    const emit: EventBusEmit = async ({ eventName, payload }) => {
      events.push({ eventName, payload })
    }

    const result = await operationFactory({ db, emit })(...args)

    await trx.commit()
    for (const event of events) {
      eventBus.emit(event)
    }
    return result as Awaited<ReturnType<TOperation>>
  }
