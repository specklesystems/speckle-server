import { DefaultAppWithUnwrappedScopes } from '@/modules/auth/defaultApps'
import {
  FullServerApp,
  ServerAppListItem,
  UserServerApp
} from '@/modules/auth/domain/types'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import {
  AuthorizationCodeRecord,
  RefreshTokenRecord
} from '@/modules/auth/repositories'
import { ServerAppRecord } from '@/modules/core/helpers/types'
import { MarkNullableOptional } from '@/modules/shared/helpers/typeHelper'
import { Optional, ServerScope } from '@speckle/shared'
import { SetOptional } from 'type-fest'
import type { Handler } from 'express'
import { Strategy, AuthenticateOptions } from 'passport'

export type GetApp = (params: { id: string }) => Promise<FullServerApp | null>

export type GetAllPublicApps = () => Promise<ServerAppListItem[]>

export type GetAllAppsCreatedByUser = (params: {
  userId: string
}) => Promise<UserServerApp[]>

export type GetAllAppsAuthorizedByUser = (params: {
  userId: string
}) => Promise<ServerAppListItem[]>

export type GetAllScopes = () => Promise<ScopeRecord[]>

export type RegisterDefaultApp = (app: DefaultAppWithUnwrappedScopes) => Promise<void>

export type UpdateDefaultApp = (
  app: DefaultAppWithUnwrappedScopes,
  existingApp: FullServerApp
) => Promise<void>

export type CreateApp = (
  app: Omit<
    MarkNullableOptional<SetOptional<ServerAppRecord, 'public'>>,
    'id' | 'secret' | 'createdAt' | 'trustByDefault'
  > & {
    scopes: ServerScope[]
  }
) => Promise<{ id: string; secret: string }>

export type RevokeExistingAppCredentials = (params: {
  appId: string
}) => Promise<number>

export type RevokeExistingAppCredentialsForUser = (params: {
  appId: string
  userId: string
}) => Promise<number>

export type RevokeRefreshToken = (params: { tokenId: string }) => Promise<boolean>

export type UpdateApp = (params: {
  app: Partial<ServerAppRecord> & { id: string } & { scopes?: ServerScope[] }
}) => Promise<string>

export type DeleteApp = (params: { id: string }) => Promise<number>

export type GetAuthorizationCode = (params: {
  id: string
}) => Promise<Optional<AuthorizationCodeRecord>>

export type DeleteAuthorizationCode = (params: { id: string }) => Promise<number>

export type CreateRefreshToken = (params: {
  token: SetOptional<RefreshTokenRecord, 'createdAt' | 'lifespan'>
}) => Promise<RefreshTokenRecord>

export type GetRefreshToken = (params: {
  id: string
}) => Promise<Optional<RefreshTokenRecord>>

export type CreateAuthorizationCode = (params: {
  appId: string
  userId: string
  challenge: string
}) => Promise<string>

export type DeleteExistingUserAuthTokens = (userId: string) => Promise<void>

export type GetAppScopes = (
  appIds: string[]
) => Promise<{ [appId: string]: Array<{ name: ServerScope; description: string }> }>

export type InitializeDefaultApps = () => Promise<void>

export type CreateAppTokenFromAccessCode = (params: {
  appId: string
  appSecret: string
  accessCode: string
  challenge: string
}) => Promise<{
  token: string
  refreshToken: string
}>

export type PassportAuthenticateHandlerBuilder = (
  strategy: Strategy | string,
  options?: Optional<AuthenticateOptions>
) => Handler

export type GetTokenAppInfo = (params: {
  token: string
  appId?: string
}) => Promise<ServerAppRecord | undefined>
