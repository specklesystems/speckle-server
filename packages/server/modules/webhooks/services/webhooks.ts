import { getServerInfo as getServerInfoFn } from '@/modules/core/services/generic'
import { ForbiddenError } from '@/modules/shared/errors'
import {
  CountWebhooksByStreamId,
  CreateWebhookConfig,
  CreateWebhookEvent,
  DeleteWebhookConfig,
  GetWebhookById,
  UpdateWebhookConfig
} from '@/modules/webhooks/domain/operations'
import { Webhook } from '@/modules/webhooks/domain/types'
import { SetValuesNullable } from '@speckle/shared'
import crs from 'crypto-random-string'
import {
  StreamWithOptionalRole,
  getStream as getStreamFn
} from '@/modules/core/repositories/streams'
import {
  getUser as getUserFn,
  UserWithOptionalRole
} from '@/modules/core/repositories/users'
import { Knex } from 'knex'

const MAX_STREAM_WEBHOOKS = 100

export const createWebhook =
  ({
    createWebhookConfig,
    countWebhooksByStreamId
  }: {
    createWebhookConfig: CreateWebhookConfig
    countWebhooksByStreamId: CountWebhooksByStreamId
  }) =>
  async ({
    streamId,
    url,
    description,
    secret,
    enabled,
    triggers
  }: Pick<Webhook, 'streamId' | 'enabled' | 'triggers'> &
    Partial<SetValuesNullable<Pick<Webhook, 'url' | 'description' | 'secret'>>>) => {
    const streamWebhookCount = await countWebhooksByStreamId({ streamId })
    if (streamWebhookCount >= MAX_STREAM_WEBHOOKS) {
      throw new Error(
        `Maximum number of webhooks for a stream reached (${MAX_STREAM_WEBHOOKS})`
      )
    }

    return await createWebhookConfig({
      id: crs({ length: 10 }),
      streamId,
      url: url ?? undefined,
      description: description ?? undefined,
      secret: secret ?? undefined,
      enabled,
      triggers
    })
  }

export const updateWebhook =
  ({ updateWebhookConfig }: { updateWebhookConfig: UpdateWebhookConfig }) =>
  async (
    webhook: Pick<Webhook, 'id'> &
      Partial<SetValuesNullable<Omit<Webhook, 'id' | 'updatedAt'>>>
  ) => {
    const { id, streamId, url, description, secret, enabled, triggers } = webhook
    return await updateWebhookConfig({
      webhookId: id,
      webhookInput: {
        streamId: streamId ?? undefined,
        url: url ?? undefined,
        description: description ?? undefined,
        secret: secret ?? undefined,
        enabled: enabled ?? undefined,
        triggers: triggers ?? undefined,
        updatedAt: new Date()
      }
    })
  }

export const deleteWebhook =
  ({
    deleteWebhookConfig,
    getWebhookById
  }: {
    deleteWebhookConfig: DeleteWebhookConfig
    getWebhookById: GetWebhookById
  }) =>
  async ({ id, streamId }: { id: string; streamId: string }) => {
    const wh = await getWebhookById({ id })
    if (streamId !== wh?.streamId)
      throw new ForbiddenError(
        'The webhook id and stream id do not match. Please check your inputs.'
      )

    await deleteWebhookConfig({ id })

    return id
  }

export const dispatchStreamEvent =
  ({
    db,
    getServerInfo,
    getStream,
    createWebhookEvent,
    getUser
  }: {
    db: Knex // TODO: this should not be injected here
    getServerInfo: typeof getServerInfoFn
    getStream: typeof getStreamFn
    createWebhookEvent: CreateWebhookEvent
    getUser: typeof getUserFn
  }) =>
  async (
    {
      streamId,
      event,
      eventPayload
    }: {
      streamId: string
      event: string
      eventPayload: {
        server: { id?: number; canonicalUrl?: string }
        streamId?: string
        stream?: StreamWithOptionalRole
        userId?: string
        user: Partial<UserWithOptionalRole> | null
        webhook: Webhook
      }
    },
    { trx }: { trx?: Knex.Transaction } = {}
  ) => {
    // Add server info
    eventPayload.server = await getServerInfo()
    eventPayload.server.canonicalUrl = process.env.CANONICAL_URL
    delete eventPayload.server.id

    // Add stream info
    if (eventPayload.streamId) {
      eventPayload.stream = await getStream(
        {
          streamId: eventPayload.streamId,
          userId: eventPayload.userId
        },
        { trx }
      )
    }

    // Add user info (except email and pwd)
    if (eventPayload.userId) {
      eventPayload.user = await getUser(eventPayload.userId)
      if (eventPayload.user) {
        delete eventPayload.user.passwordDigest
        delete eventPayload.user.email
      }
    }

    // with this select, we must have the streamid available on the webhook config,
    // even when the stream is deleted, to dispatch the stream deleted webhook events
    const { rows } = await db.raw(
      `
      SELECT * FROM webhooks_config WHERE "streamId" = ?
    `,
      [streamId]
    )
    for (const wh of rows) {
      if (!wh.enabled) continue
      if (!(event in wh.triggers)) continue

      // Add webhook info (the key `webhook` will be replaced for each webhook configured, before serializing the payload and storing it)
      eventPayload.webhook = wh
      eventPayload.webhook.triggers = Object.keys(eventPayload.webhook.triggers)
      delete eventPayload.webhook.secret

      await createWebhookEvent({
        id: crs({ length: 20 }),
        webhookId: wh.id,
        payload: JSON.stringify(eventPayload)
      })
    }
  }
