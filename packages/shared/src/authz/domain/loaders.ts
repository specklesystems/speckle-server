import { GetServerRole } from "./core/operations.js"
import { GetProject, GetProjectRole } from "./projects/operations.js"
import { GetWorkspaceRole } from "./workspaces/operations.js"

export type ChuckContextLoaders = {
  loadEnvOrSomething: () => {
    FF_ADMIN_OVERRIDE_ENABLED: boolean
    FF_WORKSPACES_MODULE_ENABLED: boolean
  }
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspace: () => Promise<Workspace>
  getWorkspaceRole: GetWorkspaceRole
}