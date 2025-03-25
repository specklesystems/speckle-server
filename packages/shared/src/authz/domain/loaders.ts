import type { GetServerRole } from './core/operations.js'
import type { GetProject, GetProjectRole } from './projects/operations.js'
import type {
  GetEnv,
  GetWorkspace,
  GetWorkspaceRole,
  GetWorkspaceSsoProvider,
  GetWorkspaceSsoSession
} from './workspaces/operations.js'

/**
 * All loaders must be listed here for app startup validation to work properly
 */
export const AuthCheckContextLoaderKeys = <const>{
  getEnv: 'getEnv',
  getProject: 'getProject',
  getProjectRole: 'getProjectRole',
  getServerRole: 'getServerRole',
  getWorkspace: 'getWorkspace',
  getWorkspaceRole: 'getWorkspaceRole',
  getWorkspaceSsoProvider: 'getWorkspaceSsoProvider',
  getWorkspaceSsoSession: 'getWorkspaceSsoSession'
}

export type AuthCheckContextLoaderKeys =
  (typeof AuthCheckContextLoaderKeys)[keyof typeof AuthCheckContextLoaderKeys]

export type AllAuthCheckContextLoaders = {
  getEnv: GetEnv
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspace: GetWorkspace
  getWorkspaceRole: GetWorkspaceRole
  getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  getWorkspaceSsoSession: GetWorkspaceSsoSession
} & {
  [key in AuthCheckContextLoaderKeys]: unknown
}

export type AuthCheckContextLoaders<
  LoaderKeys extends AuthCheckContextLoaderKeys = AuthCheckContextLoaderKeys
> = Pick<AllAuthCheckContextLoaders, LoaderKeys>

export type AuthCheckContext<LoaderKeys extends AuthCheckContextLoaderKeys> = {
  loaders: AuthCheckContextLoaders<LoaderKeys>
}
