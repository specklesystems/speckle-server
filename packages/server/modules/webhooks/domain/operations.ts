import { Webhook, WebhookEvent } from '@/modules/webhooks/domain/types'

export type CreateWebhookConfig = (
  webhook: Pick<
    Webhook,
    'id' | 'streamId' | 'url' | 'description' | 'secret' | 'enabled' | 'triggers'
  >
) => Promise<string>

export type CountWebhooksByStreamId = ({
  streamId
}: Pick<Webhook, 'streamId'>) => Promise<number>

export type GetWebhookById = ({ id }: Pick<Webhook, 'id'>) => Promise<Webhook | null>

export type UpdateWebhookConfig = ({
  webhookId,
  webhookInput
}: {
  webhookId: string
  webhookInput: Pick<Webhook, 'updatedAt'> &
    Partial<
      Pick<
        Webhook,
        'triggers' | 'streamId' | 'url' | 'enabled' | 'secret' | 'description'
      >
    >
}) => Promise<string>

export type DeleteWebhookConfig = ({ id }: Pick<Webhook, 'id'>) => Promise<number>

export type GetStreamWebhooks = ({
  streamId
}: Pick<Webhook, 'streamId'>) => Promise<Webhook[]>

export type CreateWebhookEvent = (
  event: Pick<WebhookEvent, 'id' | 'payload' | 'webhookId'>
) => Promise<string>

export type GetLastWebhookEvents = ({
  webhookId,
  limit
}: {
  webhookId: string
  limit?: number
}) => Promise<WebhookEvent[]>

export type GetWebhookEventsCount = ({
  webhookId
}: {
  webhookId: string
}) => Promise<number>
