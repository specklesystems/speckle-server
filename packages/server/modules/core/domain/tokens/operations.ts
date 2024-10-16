import {
  ApiToken,
  TokenResourceAccessDefinition,
  TokenScope,
  UserServerAppToken
} from '@/modules/core/domain/tokens/types'
import { TokenResourceIdentifierInput } from '@/modules/core/graph/generated/graphql'
import { NullableKeysToOptional, ServerScope } from '@speckle/shared'
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
