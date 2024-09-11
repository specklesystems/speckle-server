import { Webhook } from '@/modules/webhooks/domain/types'

export type CreateWebhook = (
  webhook: Pick<
    Webhook,
    'id' | 'streamId' | 'url' | 'description' | 'secret' | 'enabled' | 'triggers'
  >
) => Promise<string>

export type CountWebhooksByStreamId = ({
  streamId
}: Pick<Webhook, 'streamId'>) => Promise<number>

export type GetWebhookById = ({ id }: Pick<Webhook, 'id'>) => Promise<Webhook | null>

export type UpdateWebhook = ({
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

export type DeleteWebhook = ({ id }: Pick<Webhook, 'id'>) => Promise<number>

export type GetStreamWebhooks = ({
  streamId
}: Pick<Webhook, 'streamId'>) => Promise<Webhook[]>
