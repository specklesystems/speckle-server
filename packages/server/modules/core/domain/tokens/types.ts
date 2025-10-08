import type {
  EmbedApiTokenRecord,
  PersonalApiTokenRecord,
  TokenScopeRecord,
  UserServerAppTokenRecord
} from '@/modules/auth/helpers/types'
import type { ApiTokenRecord } from '@/modules/auth/repositories'
import type { TokenResourceAccessRecord } from '@/modules/core/helpers/types'

export const TokenResourceIdentifierType = {
  Project: 'project',
  Workspace: 'workspace'
} as const

export type TokenResourceIdentifierType =
  (typeof TokenResourceIdentifierType)[keyof typeof TokenResourceIdentifierType]

// TODO: these should be moved to domain
export type TokenResourceIdentifier = { id: string; type: TokenResourceIdentifierType }

export type ApiToken = ApiTokenRecord

export type TokenScope = TokenScopeRecord

export type TokenResourceAccessDefinition = TokenResourceAccessRecord

export type UserServerAppToken = UserServerAppTokenRecord

export type PersonalApiToken = PersonalApiTokenRecord

export type EmbedApiToken = EmbedApiTokenRecord
export type EmbedApiTokenWithMetadata = EmbedApiToken &
  Pick<ApiToken, 'createdAt' | 'lastUsed' | 'lifespan'>
