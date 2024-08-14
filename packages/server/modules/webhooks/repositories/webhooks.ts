import { Knex } from 'knex'
import { Webhook } from '@/modules/webhooks/domain/types'
import {
  CountWebhooksByStreamId,
  CreateWebhook
} from '@/modules/webhooks/domain/operations'

type WebhookConfig = Omit<Webhook, 'triggers'> & { triggers: Record<string, true> }

const tables = (db: Knex) => ({
  webhooksConfigs: db<WebhookConfig>('webhooks_config'),
  webhooksEvents: db('webhooks_events')
})

const toTriggersObj = (triggers: string[]): Record<string, true> =>
  triggers.reduce((acc, trigger) => ({ ...acc, [trigger]: true }), {})

export const createWebhookFactory =
  ({ db }: { db: Knex }): CreateWebhook =>
  async ({ id, streamId, url, description, secret, enabled, triggers }) => {
    const triggersObj = toTriggersObj(triggers)

    const [{ id: webhookId }] = await tables(db)
      .webhooksConfigs.insert({
        id,
        streamId,
        url,
        description,
        secret,
        enabled,
        triggers: triggersObj
      })
      .returning('id')
    return webhookId
  }

export const countWebhooksByStreamIdFactory =
  ({ db }: { db: Knex }): CountWebhooksByStreamId =>
  async ({ streamId }) => {
    const [res] = await tables(db).webhooksConfigs.where({ streamId }).count()
    return parseInt(res.count.toString())
  }
