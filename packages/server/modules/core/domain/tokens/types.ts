import {
  PersonalApiTokenRecord,
  TokenScopeRecord,
  UserServerAppTokenRecord
} from '@/modules/auth/helpers/types'
import { ApiTokenRecord } from '@/modules/auth/repositories'
import { TokenResourceAccessRecord } from '@/modules/core/helpers/types'

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
