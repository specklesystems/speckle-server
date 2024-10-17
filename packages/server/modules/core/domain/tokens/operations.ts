import {
  ApiToken,
  PersonalApiToken,
  TokenResourceAccessDefinition,
  TokenScope,
  UserServerAppToken
} from '@/modules/core/domain/tokens/types'
import { TokenResourceIdentifierInput } from '@/modules/core/graph/generated/graphql'
import { TokenValidationResult } from '@/modules/core/helpers/types'
import { NullableKeysToOptional, Optional, ServerScope } from '@speckle/shared'
import { SetOptional } from 'type-fest'

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

export type RevokeTokenById = (tokenId: string) => Promise<boolean>

export type RevokeUserTokenById = (tokenId: string, userId: string) => Promise<boolean>

export type GetApiTokenById = (tokenId: string) => Promise<Optional<ApiToken>>

export type GetTokenScopesById = (tokenId: string) => Promise<TokenScope[]>

export type GetTokenResourceAccessDefinitionsById = (
  tokenId: string
) => Promise<TokenResourceAccessDefinition[]>

export type UpdateApiToken = (
  tokenId: string,
  token: Partial<ApiToken>
) => Promise<ApiToken>

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

export type ValidateToken = (tokenString: string) => Promise<TokenValidationResult>
