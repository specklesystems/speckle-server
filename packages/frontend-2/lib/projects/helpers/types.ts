import type { Get } from 'type-fest'
import type { ProjectWebhooksQuery } from '~~/lib/common/generated/gql/graphql'

export type WebhookItem = NonNullable<
  Get<ProjectWebhooksQuery, 'project.webhooks.items[0]'>
>

export type WebhookFormValues = {
  url: string
  description?: string
  secret?: string
  triggers: Array<{ id: string; text: string }>
}
