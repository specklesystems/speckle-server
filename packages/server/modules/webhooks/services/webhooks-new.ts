import {
  CountWebhooksByStreamId,
  CreateWebhook,
  UpdateWebhook
} from '@/modules/webhooks/domain/operations'
import { Webhook } from '@/modules/webhooks/domain/types'
import { SetValuesNullable } from '@speckle/shared'
import crs from 'crypto-random-string'

const MAX_STREAM_WEBHOOKS = 100

export const createWebhook =
  ({
    createWebhookConfig,
    countWebhooksByStreamId
  }: {
    createWebhookConfig: CreateWebhook
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
  ({ updateWebhookConfig }: { updateWebhookConfig: UpdateWebhook }) =>
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
