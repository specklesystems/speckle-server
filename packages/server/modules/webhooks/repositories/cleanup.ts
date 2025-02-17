import { Knex } from 'knex'

export const cleanOrphanedWebhookConfigsFactory =
  ({ db }: { db: Knex }) =>
  async () => {
    await db.raw(
      // i know im using a where in here, but this is used as background operation
      `
      delete from webhooks_config
      where id in (
        select wh.id from webhooks_config wh
        left join streams st on wh."streamId" = st.id
        where st.id is null
      )
    `
    )
  }
