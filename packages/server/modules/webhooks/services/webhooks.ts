import { ForbiddenError } from '@/modules/shared/errors'
import {
  CountWebhooksByStreamId,
  CreateWebhookConfig,
  CreateWebhookEvent,
  DeleteWebhookConfig,
  GetStreamWebhooks,
  GetWebhookById,
  UpdateWebhookConfig
} from '@/modules/webhooks/domain/operations'
import { Webhook } from '@/modules/webhooks/domain/types'
import { SetValuesNullable } from '@speckle/shared'
import crs from 'crypto-random-string'
import { StreamWithOptionalRole } from '@/modules/core/repositories/streams'
import { ServerInfo } from '@/modules/core/helpers/types'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { UserWithOptionalRole } from '@/modules/core/domain/users/types'
import { GetUser } from '@/modules/core/domain/users/operations'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

const MAX_STREAM_WEBHOOKS = 100

export const createWebhookFactory =
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

export const updateWebhookFactory =
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

export const deleteWebhookFactory =
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

export const dispatchStreamEventFactory =
  ({
    getServerInfo,
    getStream,
    createWebhookEvent,
    getStreamWebhooks,
    getUser
  }: {
    getServerInfo: GetServerInfo
    getStreamWebhooks: GetStreamWebhooks
    getStream: GetStream
    createWebhookEvent: CreateWebhookEvent
    getUser: GetUser
  }) =>
  async ({
    streamId,
    event,
    eventPayload
  }: {
    streamId: string
    event: string
    eventPayload: {
      streamId?: string
      stream?: StreamWithOptionalRole
      userId?: string | null
      user?: Partial<UserWithOptionalRole> | null
    }
  }) => {
    const payload: typeof eventPayload & {
      server: Partial<Omit<ServerInfo, 'secret'>>
    } = {
      ...eventPayload,
      server: { ...(await getServerInfo()), canonicalUrl: getServerOrigin() }
    }
    // Add server info
    payload.server = await getServerInfo()
    payload.server.canonicalUrl = getServerOrigin()
    delete payload.server.id

    // Add stream info
    if (payload.streamId) {
      payload.stream = await getStream({
        streamId: payload.streamId,
        userId: payload.userId ?? undefined
      })
    }

    // Add user info (except email and pwd)
    if (payload.userId) {
      payload.user = await getUser(payload.userId)
      if (payload.user) {
        delete payload.user.passwordDigest
        delete payload.user.email
      }
    }

    // with this select, we must have the streamid available on the webhook config,
    // even when the stream is deleted, to dispatch the stream deleted webhook events
    const rows = await getStreamWebhooks({ streamId })
    for (const wh of rows) {
      if (!wh.enabled) continue
      if (!wh.triggers.includes(event)) continue

      // Add webhook info (the key `webhook` will be replaced for each webhook configured, before serializing the payload and storing it)
      wh.triggers = Object.keys(wh.triggers)
      delete wh.secret

      await createWebhookEvent({
        id: crs({ length: 20 }),
        webhookId: wh.id,
        payload: JSON.stringify({ ...payload, webhook: wh })
      })
    }
  }
