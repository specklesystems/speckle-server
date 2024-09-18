import { DefaultAppWithUnwrappedScopes } from '@/modules/auth/defaultApps'
import {
  FullServerApp,
  ServerAppListItem,
  UserServerApp
} from '@/modules/auth/domain/types'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { ServerAppRecord } from '@/modules/core/helpers/types'
import { MarkNullableOptional } from '@/modules/shared/helpers/typeHelper'
import { ServerScope } from '@speckle/shared'

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
    MarkNullableOptional<ServerAppRecord>,
    'id' | 'secret' | 'createdAt' | 'trustByDefault'
  > & {
    scopes: ServerScope[]
  }
) => Promise<{ id: string; secret: string }>

export type RevokeExistingAppCredentials = (params: {
  appId: string
}) => Promise<number>

export type UpdateApp = (params: {
  app: Partial<ServerAppRecord> & { id: string } & { scopes?: ServerScope[] }
}) => Promise<string>

export type DeleteApp = (params: { id: string }) => Promise<number>

export type InitializeDefaultApps = () => Promise<void>
