import {
  CountWebhooksByStreamId,
  CreateWebhook
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
  }: Pick<Webhook, 'streamId' | 'enabled'> &
    Partial<
      SetValuesNullable<Pick<Webhook, 'url' | 'description' | 'secret' | 'triggers'>>
    >) => {
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
      triggers: triggers ?? []
    })
  }
