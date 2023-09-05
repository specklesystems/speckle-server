import { Get } from 'type-fest'
import { ProjectWebhooksQuery } from '~~/lib/common/generated/gql/graphql'

export type WebhookItem = NonNullable<
  Get<ProjectWebhooksQuery, 'project.webhooks.items[0]'>
>
