import { Knex } from 'knex'
import { Webhook, WebhookEvent } from '@/modules/webhooks/domain/types'
import {
  CountWebhooksByStreamId,
  CreateWebhookConfig,
  CreateWebhookEvent,
  DeleteWebhookConfig,
  GetLastWebhookEvents,
  GetStreamWebhooks,
  GetWebhookById,
  GetWebhookEventsCount,
  UpdateWebhookConfig
} from '@/modules/webhooks/domain/operations'

type WebhookConfig = Omit<Webhook, 'triggers'> & { triggers: Record<string, true> }

const tables = (db: Knex) => ({
  webhooksConfigs: db<WebhookConfig>('webhooks_config'),
  webhooksEvents: db<WebhookEvent>('webhooks_events')
})

const toTriggersObj = (triggers: string[]): Record<string, true> =>
  triggers.reduce((acc, trigger) => ({ ...acc, [trigger]: true }), {})

const toTriggersArray = (triggers: Record<string, true>): string[] =>
  Object.keys(triggers)

export const createWebhookConfigFactory =
  ({ db }: { db: Knex }): CreateWebhookConfig =>
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

export const updateWebhookConfigFactory =
  ({ db }: { db: Knex }): UpdateWebhookConfig =>
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

export const deleteWebhookConfigFactory =
  ({ db }: { db: Knex }): DeleteWebhookConfig =>
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

export const createWebhookEventFactory =
  ({ db }: { db: Knex }): CreateWebhookEvent =>
  async (event) => {
    return await tables(db).webhooksEvents.insert(event).returning('id')
  }

export const getLastWebhookEventsFactory =
  ({ db }: { db: Knex }): GetLastWebhookEvents =>
  async ({ webhookId, limit }) => {
    if (!limit) {
      limit = 100
    }

    return await tables(db)
      .webhooksEvents.select('*')
      .where({ webhookId })
      .orderBy('lastUpdate', 'desc')
      .limit(limit)
  }

export const getWebhookEventsCountFactory =
  ({ db }: { db: Knex }): GetWebhookEventsCount =>
  async ({ webhookId }) => {
    const [res] = await tables(db).webhooksEvents.count().where({ webhookId })

    return parseInt(res.count.toString())
  }
