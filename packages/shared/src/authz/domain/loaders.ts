import type { GetServerRole } from './core/operations.js'
import type { GetProject, GetProjectRole } from './projects/operations.js'
import type {
  GetEnv,
  GetWorkspace,
  GetWorkspaceRole,
  GetWorkspaceSsoProvider,
  GetWorkspaceSsoSession
} from './workspaces/operations.js'

export type AuthCheckContext<LoaderKeys extends keyof AuthCheckContextLoaders> = {
  loaders: Pick<AuthCheckContextLoaders, LoaderKeys>
}

export type AuthCheckContextLoaders = {
  getEnv: GetEnv
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspace: GetWorkspace
  getWorkspaceRole: GetWorkspaceRole
  getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  getWorkspaceSsoSession: GetWorkspaceSsoSession
}
