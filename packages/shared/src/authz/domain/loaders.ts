import { GetServerRole } from './core/operations.js'
import { GetProject, GetProjectRole } from './projects/operations.js'
import {
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
