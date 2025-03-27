import { isJust } from 'true-myth/maybe'
import { err, isErr, isOk, ok } from 'true-myth/result'
import { Roles } from '../../core/constants.js'
import { hasMinimumProjectRole, isPubliclyReadableProject } from '../checks/projects.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionInvalidError
} from '../domain/authErrors.js'
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
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession,
  MaybeUserContext & ProjectContext,
  | typeof ServerNoSessionError
  | typeof ServerNoAccessError
  | typeof ProjectNotFoundError
  | typeof ProjectNoAccessError
  | typeof WorkspaceNoAccessError
  | typeof WorkspaceSsoSessionInvalidError
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
    // if (isErr(project)) return err(project.error)
    if (isErr(project)) {
      switch (project.error.code) {
        case 'ProjectNoAccess':
        case 'ProjectNotFound':
        case 'WorkspaceSsoSessionInvalid':
          return err(project.error)
        default:
          throwUncoveredError(project.error)
      }
    }

    // All users may read public projects
    if (await isPubliclyReadableProject(loaders)({ projectId })) return ok()

    // From this point on, you cannot pass as an unknown user, need to log in
    if (!userId) return err(ServerNoSessionError)
    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (!isActiveServerUser) return err(ServerNoAccessError)

    // When G O D M O D E is enabled
    if (await canUseAdminOverride(loaders)({ userId })) return ok()

    const { workspaceId } = project.value
    // When a project belongs to a workspace
    if (env.FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // User must have a workspace role to read project data
      if (!(await hasAnyWorkspaceRole(loaders)({ userId, workspaceId })))
        return err(WorkspaceNoAccessError)

      const memberWithSsoSession = await maybeMemberRoleWithValidSsoSessionIfNeeded(
        loaders
      )({
        userId,
        workspaceId
      })

      if (isJust(memberWithSsoSession)) {
        // if a member, make sure it has a valid sso session
        return isOk(memberWithSsoSession.value)
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
      : err(ProjectNoAccessError)
  }
