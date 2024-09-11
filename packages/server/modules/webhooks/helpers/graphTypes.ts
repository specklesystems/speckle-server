import { Webhook } from '@/modules/webhooks/domain/types'

export type WebhookGraphQLReturn = Webhook & {
  hasSecret: boolean
  prejectId: string
}
