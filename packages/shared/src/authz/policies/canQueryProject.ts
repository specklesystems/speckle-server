import { Roles } from '../../core/constants.js'
import { hasMinimumProjectRole, isPubliclyReadableProject } from '../checks/projects.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../domain/loaders.js'
import { AuthPolicy, MaybeUserContext, ProjectContext } from '../domain/policies.js'
import { canUseAdminOverride, hasMinimumServerRole } from '../checks/serverRole.js'
import { hasAnyWorkspaceRole } from '../checks/workspaceRole.js'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from '../fragments/workspaceSso.js'
import { throwUncoveredError } from '../../core/index.js'

export const canQueryProjectPolicy: AuthPolicy<
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspace,
  MaybeUserContext & ProjectContext,
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()

    // we prerolad the project and early return any loading errors
    // this is a short circuit in the frontend, to surface any project load errors
    // from the backend.
    // make sure to expose all of the error types in the loader type,
    // that we care about in this early return
    const project = await loaders.getProject({ projectId })
    if (project.isErr) {
      switch (project.error.code) {
        case 'ProjectNoAccess':
        case 'ProjectNotFound':
        case 'WorkspaceSsoSessionNoAccess':
          return err(project.error)
        default:
          throwUncoveredError(project.error)
      }
    }

    // All users may read public projects
    if (await isPubliclyReadableProject(loaders)({ projectId })) return ok()

    // From this point on, you cannot pass as an unknown user, need to log in
    if (!userId) return err(new ServerNoSessionError())
    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (!isActiveServerUser) return err(new ServerNoAccessError())

    // When G O D M O D E is enabled
    if (await canUseAdminOverride(loaders)({ userId })) return ok()

    const { workspaceId } = project.value
    // When a project belongs to a workspace
    if (env.FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // User must have a workspace role to read project data
      if (!(await hasAnyWorkspaceRole(loaders)({ userId, workspaceId })))
        return err(new WorkspaceNoAccessError())

      const memberWithSsoSession = await maybeMemberRoleWithValidSsoSessionIfNeeded(
        loaders
      )({
        userId,
        workspaceId
      })

      if (memberWithSsoSession.isJust) {
        // if a member, make sure it has a valid sso session
        return memberWithSsoSession.value.isOk
          ? ok()
          : err(memberWithSsoSession.value.error)
      } else {
        // just fall through to the generic project role check for workspace:guest-s
        // they do not need an sso session
      }
    }

    // User must have at least stream:reviewer role to read project data
    return (await hasMinimumProjectRole(loaders)({
      userId,
      projectId,
      role: 'stream:reviewer'
    }))
      ? ok()
      : err(new ProjectNoAccessError())
  }
