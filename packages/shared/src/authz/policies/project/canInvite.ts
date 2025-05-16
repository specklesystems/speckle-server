import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceNoAccessError,
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNotEnoughPermissionsError,
  ProjectNotEnoughPermissionsError,
  WorkspaceNotEnoughPermissionsError,
  PersonalProjectsLimitedError
} from '../../domain/authErrors.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { Roles } from '../../../core/constants.js'
import { ensureImplicitProjectMemberWithWriteAccessFragment } from '../../fragments/projects.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors =
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNotEnoughPermissionsError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof PersonalProjectsLimitedError>

export const canInviteToProjectPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })

    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)
    const ensuredProjectRole = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId: userId!,
      projectId,
      role: Roles.Stream.Owner
    })

    if (ensuredProjectRole.isErr) return err(ensuredProjectRole.error)

    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })
    if (project && !project.workspaceId && env.FF_PERSONAL_PROJECTS_LIMITS_ENABLED) {
      // Prevent inviting collaborators to personal projects
      return err(
        new PersonalProjectsLimitedError({
          message: 'No new collaborators can be added to personal projects'
        })
      )
    }

    return ok()
  }
