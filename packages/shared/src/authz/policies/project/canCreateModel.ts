import { err, ok } from 'true-myth/result'
import {
  ProjectNotFoundError,
  ProjectNoAccessError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceLimitsReachedError,
  ServerNoSessionError,
  ServerNoAccessError,
  WorkspaceRequiredError,
  WorkspaceReadOnlyError
} from '../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { hasMinimumServerRole } from '../../checks/serverRole.js'
import { Roles } from '../../../core/constants.js'
import { hasMinimumProjectRole } from '../../checks/projects.js'
import { maybeMemberRoleWithValidSsoSessionIfNeeded } from '../../fragments/workspaceSso.js'
import { throwUncoveredError } from '../../../core/index.js'
import { isWorkspacePlanStatusReadOnly } from '../../../workspaces/index.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan
  | typeof AuthCheckContextLoaderKeys.getWorkspaceLimits
  | typeof AuthCheckContextLoaderKeys.getWorkspaceModelCount

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors =
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof WorkspaceRequiredError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>

export const canCreateModelPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()
    if (!userId) return err(new ServerNoSessionError())

    const hasServerRole = await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (!hasServerRole) return err(new ServerNoAccessError())

    const isStreamContributor = await hasMinimumProjectRole(loaders)({
      userId,
      projectId,
      role: Roles.Stream.Contributor
    })
    if (!isStreamContributor) return err(new ProjectNoAccessError())

    if (!env.FF_WORKSPACES_MODULE_ENABLED) {
      // Self-hosted servers may create models in "personal" projects
      return ok()
    }

    const project = await loaders.getProject({ projectId })
    if (!project?.workspaceId) return err(new WorkspaceRequiredError())

    const { workspaceId } = project

    const memberWithSsoSession = await maybeMemberRoleWithValidSsoSessionIfNeeded(
      loaders
    )({
      userId,
      workspaceId
    })

    if (!memberWithSsoSession.isNothing && memberWithSsoSession.value.isErr) {
      switch (memberWithSsoSession.value.error.code) {
        case 'WorkspaceNoAccess':
        case 'WorkspaceSsoSessionNoAccess':
          return err(memberWithSsoSession.value.error)
        default:
          throwUncoveredError(memberWithSsoSession.value.error)
      }
    }

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())
    if (isWorkspacePlanStatusReadOnly(workspacePlan.status))
      return err(new WorkspaceReadOnlyError())

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    if (workspaceLimits.modelCount === null) return ok()

    const currentModelCount = await loaders.getWorkspaceModelCount({ workspaceId })

    if (currentModelCount === null) return err(new WorkspaceNoAccessError())

    return currentModelCount < workspaceLimits.modelCount
      ? ok()
      : err(new WorkspaceLimitsReachedError({ payload: { limit: 'modelCount' } }))
  }
