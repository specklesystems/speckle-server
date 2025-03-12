import { GetServerRole } from './core/operations.js'
import { GetProject, GetProjectRole } from './projects/operations.js'
import {
  GetWorkspace,
  GetWorkspaceRole,
  GetWorkspaceSsoProvider,
  GetWorkspaceSsoSession
} from './workspaces/operations.js'

export type ChuckContext<LoaderKeys extends keyof ChuckContextLoaders> = {
  loaders: Pick<ChuckContextLoaders, LoaderKeys>
}

export type ChuckContextLoaders = {
  getEnv: () => {
    FF_ADMIN_OVERRIDE_ENABLED: boolean
    FF_WORKSPACES_MODULE_ENABLED: boolean
  }
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspace: GetWorkspace
  getWorkspaceRole: GetWorkspaceRole
  getWorkspaceSsoProvider: GetWorkspaceSsoProvider
  getWorkspaceSsoSession: GetWorkspaceSsoSession
}
