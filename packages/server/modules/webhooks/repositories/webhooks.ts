import { Knex } from 'knex'
import { Webhook } from '@/modules/webhooks/domain/types'
import {
  CountWebhooksByStreamId,
  CreateWebhook,
  DeleteWebhook,
  GetStreamWebhooks,
  GetWebhookById,
  UpdateWebhook
} from '@/modules/webhooks/domain/operations'

type WebhookConfig = Omit<Webhook, 'triggers'> & { triggers: Record<string, true> }

const tables = (db: Knex) => ({
  webhooksConfigs: db<WebhookConfig>('webhooks_config'),
  webhooksEvents: db('webhooks_events')
})

const toTriggersObj = (triggers: string[]): Record<string, true> =>
  triggers.reduce((acc, trigger) => ({ ...acc, [trigger]: true }), {})

const toTriggersArray = (triggers: Record<string, true>): string[] =>
  Object.keys(triggers)

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

export const getWebhookByIdFactory =
  ({ db }: { db: Knex }): GetWebhookById =>
  async ({ id }) => {
    const webhook = await tables(db).webhooksConfigs.select('*').where({ id }).first()
    if (!webhook) {
      return null
    }

    return { ...webhook, triggers: toTriggersArray(webhook.triggers) }
  }

export const updateWebhookFactory =
  ({ db }: { db: Knex }): UpdateWebhook =>
  async ({ webhookId, webhookInput }) => {
    const { triggers, ...update } = webhookInput
    let triggersObj: Record<string, true> | undefined
    if (triggers) {
      triggersObj = toTriggersObj(triggers)
    }

    await tables(db)
      .webhooksConfigs.where({ id: webhookId })
      .update({ ...update, triggers: triggersObj })

    return webhookId
  }

export const deleteWebhookFactory =
  ({ db }: { db: Knex }): DeleteWebhook =>
  async ({ id }) => {
    return await tables(db).webhooksConfigs.where({ id }).del()
  }

export const getStreamWebhooksFactory =
  ({ db }: { db: Knex }): GetStreamWebhooks =>
  async ({ streamId }) => {
    const webhooks = await tables(db)
      .webhooksConfigs.select('*')
      .where({ streamId })
      .orderBy('updatedAt', 'desc')

    return webhooks.map((webhook) => ({
      ...webhook,
      triggers: toTriggersArray(webhook.triggers)
    }))
  }
