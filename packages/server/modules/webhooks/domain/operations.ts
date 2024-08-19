import { Webhook } from '@/modules/webhooks/domain/types'

export type CreateWebhook = (
  webhook: Pick<
    Webhook,
    'id' | 'streamId' | 'url' | 'description' | 'secret' | 'enabled'
  > & { triggers: string[] }
) => Promise<string>

export type CountWebhooksByStreamId = ({
  streamId
}: Pick<Webhook, 'streamId'>) => Promise<number>

export type GetWebhookById = ({ id }: Pick<Webhook, 'id'>) => Promise<Webhook | null>
