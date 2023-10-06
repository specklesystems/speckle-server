import { AllScopes } from '@speckle/shared'
import { Get } from 'type-fest'
import { DeveloperSettingsAccessTokensQuery } from '~~/lib/common/generated/gql/graphql'

export type TokenItem = NonNullable<
  Get<DeveloperSettingsAccessTokensQuery, 'activeUser.apiTokens[0]'>
>

export type TokenFormValues = {
  name: string
  scopes: Array<{ id: (typeof AllScopes)[number]; text: string }>
}
