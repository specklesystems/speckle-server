import { OverrideProperties } from 'type-fest'
import { MaybeAsync } from '../../core/index.js'
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
export const AuthCheckContextLoaderKeys = <const>{
  getEnv: 'getEnv',
  getAutomateFunction: 'getAutomateFunction',
  getProject: 'getProject',
  getProjectRoleCounts: 'getProjectRoleCounts',
  getProjectRole: 'getProjectRole',
  getProjectModelCount: 'getProjectModelCount',
  getServerRole: 'getServerRole',
  getWorkspace: 'getWorkspace',
  getUsersCurrentAndEligibleToBecomeAMemberWorkspaces:
    'getUsersCurrentAndEligibleToBecomeAMemberWorkspaces',
  getWorkspaceRole: 'getWorkspaceRole',
  getWorkspaceSeat: 'getWorkspaceSeat',
  getWorkspaceModelCount: 'getWorkspaceModelCount',
  getWorkspaceProjectCount: 'getWorkspaceProjectCount',
  getWorkspacePlan: 'getWorkspacePlan',
  getWorkspaceLimits: 'getWorkspaceLimits',
  getWorkspaceSsoProvider: 'getWorkspaceSsoProvider',
  getWorkspaceSsoSession: 'getWorkspaceSsoSession',
  getAdminOverrideEnabled: 'getAdminOverrideEnabled',
  getComment: 'getComment',
  getModel: 'getModel',
  getVersion: 'getVersion'
}
export const Loaders = AuthCheckContextLoaderKeys // shorter alias
/* v8 ignore end  */

export type AuthCheckContextLoaderKeys =
  (typeof AuthCheckContextLoaderKeys)[keyof typeof AuthCheckContextLoaderKeys]

export type AllAuthCheckContextLoaders = AuthContextLoaderMappingDefinition<{
  getEnv: GetEnv
  getAdminOverrideEnabled: GetAdminOverrideEnabled
  getAutomateFunction: GetAutomateFunction
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
}>

export type AuthCheckContextLoaders<
  LoaderKeys extends AuthCheckContextLoaderKeys = AuthCheckContextLoaderKeys
> = Pick<AllAuthCheckContextLoaders, LoaderKeys>

export type AuthCheckContext<LoaderKeys extends AuthCheckContextLoaderKeys> = {
  loaders: AuthCheckContextLoaders<LoaderKeys>
}
