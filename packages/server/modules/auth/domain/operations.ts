import { DefaultAppWithUnwrappedScopes } from '@/modules/auth/defaultApps'
import {
  FullServerApp,
  ServerAppListItem,
  UserServerApp
} from '@/modules/auth/domain/types'
import { ScopeRecord } from '@/modules/auth/helpers/types'

export type GetApp = (params: { id: string }) => Promise<FullServerApp | null>

export type GetAllPublicApps = () => Promise<ServerAppListItem[]>

export type GetAllAppsCreatedByUser = (params: {
  userId: string
}) => Promise<UserServerApp[]>

export type GetAllScopes = () => Promise<ScopeRecord[]>

export type RegisterDefaultApp = (app: DefaultAppWithUnwrappedScopes) => Promise<void>

export type UpdateDefaultApp = (
  app: DefaultAppWithUnwrappedScopes,
  existingApp: FullServerApp
) => Promise<void>

export type InitializeDefaultApps = () => Promise<void>
