import { OverrideProperties } from 'type-fest'
import { MaybeAsync, StringEnum, StringEnumValues } from '../../core/index.js'
import type { GetServerRole } from './core/operations.js'
import type {
  GetProject,
  GetProjectModelCount,
  GetProjectRole,
  GetProjectRoleCounts
} from './projects/operations.js'
import type {
  GetAdminOverrideEnabled,
  GetEnv,
  GetUserWorkspaces,
  GetWorkspace,
  GetWorkspaceLimits,
  GetWorkspaceModelCount,
  GetWorkspacePlan,
  GetWorkspaceProjectCount,
  GetWorkspaceRole,
  GetWorkspaceSeat,
  GetWorkspaceSsoProvider,
  GetWorkspaceSsoSession
} from './workspaces/operations.js'
import { GetComment } from './comments/operations.js'
import { GetModel } from './models/operations.js'
import { GetVersion } from './versions/operations.js'
import { GetAutomateFunction } from './automate/operations.js'
import { GetSavedView, GetSavedViewGroup } from './savedViews/operations.js'
import { GetDashboard } from './dashboards/operations.js'

// utility type that ensures all properties functions that return promises
type PromiseAll<T> = {
  [K in keyof T]: T[K] extends (...args: infer Args) => MaybeAsync<infer Return>
    ? (...args: Args) => Promise<Return>
    : never
}

// wrapper type for AllAuthCheckContextLoaders that ensures loaders follow the expected schema
type AuthContextLoaderMappingDefinition<
  Mapping extends {
    [Key in keyof Mapping]: Key extends AuthCheckContextLoaderKeys
      ? Mapping[Key]
      : never
  }
> = PromiseAll<
  OverrideProperties<
    {
      [key in AuthCheckContextLoaderKeys]: unknown
    },
    Mapping
  >
>

/**
 * All loaders must be listed here for app startup validation to work properly
 */

/* v8 ignore start  */
export const AuthCheckContextLoaderKeys = StringEnum([
  'getEnv',
  'getAutomateFunction',
  'getDashboard',
  'getProject',
  'getProjectRoleCounts',
  'getProjectRole',
  'getProjectModelCount',
  'getServerRole',
  'getWorkspace',
  'getUsersCurrentAndEligibleToBecomeAMemberWorkspaces',
  'getWorkspaceRole',
  'getWorkspaceSeat',
  'getWorkspaceModelCount',
  'getWorkspaceProjectCount',
  'getWorkspacePlan',
  'getWorkspaceLimits',
  'getWorkspaceSsoProvider',
  'getWorkspaceSsoSession',
  'getAdminOverrideEnabled',
  'getComment',
  'getModel',
  'getVersion',
  'getSavedView',
  'getSavedViewGroup'
])

export const Loaders = AuthCheckContextLoaderKeys // shorter alias
/* v8 ignore end  */

export type AuthCheckContextLoaderKeys = StringEnumValues<
  typeof AuthCheckContextLoaderKeys
>

export type AllAuthCheckContextLoaders = AuthContextLoaderMappingDefinition<{
  getEnv: GetEnv
  getAdminOverrideEnabled: GetAdminOverrideEnabled
  getAutomateFunction: GetAutomateFunction
  getDashboard: GetDashboard
  getProject: GetProject
  getProjectRole: GetProjectRole
  getProjectRoleCounts: GetProjectRoleCounts
  getProjectModelCount: GetProjectModelCount
  getServerRole: GetServerRole
  getWorkspace: GetWorkspace
  getUsersCurrentAndEligibleToBecomeAMemberWorkspaces: GetUserWorkspaces
  getWorkspaceRole: GetWorkspaceRole
  getWorkspaceLimits: GetWorkspaceLimits
  getWorkspacePlan: GetWorkspacePlan
  getWorkspaceSeat: GetWorkspaceSeat
  getWorkspaceProjectCount: GetWorkspaceProjectCount
  getWorkspaceModelCount: GetWorkspaceModelCount
  getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  getWorkspaceSsoSession: GetWorkspaceSsoSession
  getComment: GetComment
  getModel: GetModel
  getVersion: GetVersion
  getSavedView: GetSavedView
  getSavedViewGroup: GetSavedViewGroup
}>

export type AuthCheckContextLoaders<
  LoaderKeys extends AuthCheckContextLoaderKeys = AuthCheckContextLoaderKeys
> = Pick<AllAuthCheckContextLoaders, LoaderKeys>

export type AuthCheckContext<LoaderKeys extends AuthCheckContextLoaderKeys> = {
  loaders: AuthCheckContextLoaders<LoaderKeys>
}
