import type {
  ApiToken,
  EmbedApiToken,
  EmbedApiTokenWithMetadata,
  PersonalApiToken,
  TokenResourceAccessDefinition,
  TokenResourceIdentifierType,
  TokenScope,
  UserServerAppToken
} from '@/modules/core/domain/tokens/types'
import type { TokenValidationResult } from '@/modules/core/helpers/types'
import type { NullableKeysToOptional, Optional, ServerScope } from '@speckle/shared'
import type { SetOptional } from 'type-fest'

export type StoreApiToken = (
  token: SetOptional<
    NullableKeysToOptional<ApiToken>,
    'createdAt' | 'lastUsed' | 'lifespan' | 'revoked'
  >
) => Promise<ApiToken>

export type StoreTokenScopes = (scopes: TokenScope[]) => Promise<void>

export type StoreTokenResourceAccessDefinitions = (
  defs: TokenResourceAccessDefinition[]
) => Promise<void>

export type StoreUserServerAppToken = (
  token: UserServerAppToken
) => Promise<UserServerAppToken>

export type StorePersonalApiToken = (
  token: PersonalApiToken
) => Promise<PersonalApiToken>

export type StoreEmbedApiToken = (token: EmbedApiToken) => Promise<EmbedApiToken>

export type GetUserPersonalAccessTokens = (userId: string) => Promise<
  {
    id: string
    name: string | null
    lastChars: string | null
    createdAt: Date
    lifespan: number | bigint
    lastUsed: Date
    scopes: ServerScope[]
  }[]
>

export type ListProjectEmbedTokens = (args: {
  projectId: string
  filter?: {
    limit?: number
    createdBefore?: string | null
  }
}) => Promise<EmbedApiTokenWithMetadata[]>

export type CountProjectEmbedTokens = (args: { projectId: string }) => Promise<number>

export type RevokeTokenById = (tokenId: string) => Promise<boolean>

export type RevokeUserTokenById = (tokenId: string, userId: string) => Promise<boolean>

export type RevokeEmbedTokenById = (args: {
  tokenId: string
  projectId: string
}) => Promise<boolean>

export type RevokeProjectEmbedTokens = (args: { projectId: string }) => Promise<void>

export type GetApiTokenById = (tokenId: string) => Promise<Optional<ApiToken>>

export type GetTokenScopesById = (tokenId: string) => Promise<TokenScope[]>

export type GetTokenResourceAccessDefinitionsById = (
  tokenId: string
) => Promise<TokenResourceAccessDefinition[]>

export type UpdateApiToken = (
  tokenId: string,
  token: Partial<ApiToken>
) => Promise<ApiToken>

export type TokenResourceIdentifierInput = {
  id: string
  type: TokenResourceIdentifierType
}

export type CreateAndStoreUserToken = (params: {
  userId: string
  name: string
  scopes: ServerScope[]
  lifespan?: number | bigint
  limitResources?: TokenResourceIdentifierInput[] | null
}) => Promise<{ id: string; token: string }>

export type CreateAndStoreAppToken = (
  params: Parameters<CreateAndStoreUserToken>[0] & {
    appId: string
  }
) => Promise<string>

export type CreateAndStorePersonalAccessToken = (
  userId: string,
  name: string,
  scopes: ServerScope[],
  lifespan?: number | bigint
) => Promise<string>

export type CreateAndStoreEmbedToken = (args: {
  projectId: string
  userId: string
  /**
   * The models (and optional versions) included in the embed.
   * @example 'foo123,bar456@baz789'
   */
  resourceIdString: string
  lifespan?: number | bigint
}) => Promise<{
  token: string
  tokenMetadata: EmbedApiTokenWithMetadata
}>

export type GetPaginatedProjectEmbedTokens = (args: {
  projectId: string
  filter?: {
    limit?: number
    cursor?: string
  }
}) => Promise<{
  items: EmbedApiTokenWithMetadata[]
  totalCount: number
  cursor: string | null
}>

export type ValidateToken = (tokenString: string) => Promise<TokenValidationResult>
