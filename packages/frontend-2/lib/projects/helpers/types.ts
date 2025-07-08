import type { Get } from 'type-fest'
import type {
  ProjectWebhooksQuery,
  ProjectEmbedTokensQuery
} from '~~/lib/common/generated/gql/graphql'

export type WebhookItem = NonNullable<
  Get<ProjectWebhooksQuery, 'project.webhooks.items[0]'>
>

export type WebhookFormValues = {
  url: string
  description?: string
  secret?: string
  triggers: Array<{ id: string; text: string }>
}

export type EmbedTokenItem = NonNullable<
  Get<ProjectEmbedTokensQuery, 'project.embedTokens.items[0]'>
>
