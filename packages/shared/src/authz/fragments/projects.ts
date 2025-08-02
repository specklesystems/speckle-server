import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext, UserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import {
  AuthPolicyCheckFragment,
  AuthPolicyEnsureFragment
} from '../domain/policies.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { Roles, StreamRoles } from '../../core/constants.js'
import { isMinimumProjectRole } from '../domain/logic/roles.js'
import { hasMinimumProjectRole, isPubliclyReadableProject } from '../checks/projects.js'
import {
  ensureCanUseWorkspacePlanFeatureFragment,
  ensureWorkspaceRoleAndSessionFragment
} from './workspaces.js'
import {
  checkIfAdminOverrideEnabledFragment,
  ensureMinimumServerRoleFragment
} from './server.js'
import { ProjectVisibility } from '../domain/projects/types.js'
import { WorkspacePlanFeatures } from '../../workspaces/index.js'

const workspaceRoleImplicitProjectRoleMap = (projectVisibility: ProjectVisibility) => {
  const isFullyPrivate = projectVisibility === ProjectVisibility.Private

  return <const>{
    [Roles.Workspace.Admin]: Roles.Stream.Owner,
    [Roles.Workspace.Member]: isFullyPrivate ? null : Roles.Stream.Reviewer,
    [Roles.Workspace.Guest]: null
  }
}

/**
 * Ensure user has a minimum explicit or implicit project role
 */
export const ensureMinimumProjectRoleFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  ProjectContext &
    UserContext & {
      /**
       * Optionally specify role the user should have
       */
      role?: StreamRoles
      /**
       * Optionally only allow explicit project roles
       */
      explicit?: boolean
    },
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof ProjectNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId, role, explicit }) => {
    const requiredProjectRole = role || Roles.Stream.Reviewer
    const isTestingForMinimumAccess = requiredProjectRole === Roles.Stream.Reviewer

    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    // Check for explicit project role first
    const hasExplicitProjectRole = await hasMinimumProjectRole(loaders)({
      userId,
      projectId,
      role: requiredProjectRole
    })
    if (hasExplicitProjectRole) return ok()

    // Now check if there's an implicit one
    const { workspaceId } = project

    if (env.FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // Check for implicit workspace project role
      const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
      if (userWorkspaceRole) {
        const implicitProjectRole = explicit
          ? null
          : workspaceRoleImplicitProjectRoleMap(project.visibility)[userWorkspaceRole]
        if (implicitProjectRole) {
          // Does it fit minimum?
          if (isMinimumProjectRole(implicitProjectRole, requiredProjectRole)) {
            return ok()
          } else {
            // Have some permissions, but not enough
            return err(new ProjectNotEnoughPermissionsError())
          }
        }
      }
    }

    // Do we have any role at all?
    const anyRoleFound = await loaders.getProjectRole({ userId, projectId })

    return err(
      isTestingForMinimumAccess || !anyRoleFound
        ? new ProjectNoAccessError()
        : new ProjectNotEnoughPermissionsError()
    )
  }

/**
 * Ensure user has access to the project's workspace (has role & SSO session, if any), if it has one
 */
export const ensureProjectWorkspaceAccessFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceRole,
  { userId: string; projectId: string },
  InstanceType<
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotFoundError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    const { workspaceId } = project
    if (!workspaceId || !env.FF_WORKSPACES_MODULE_ENABLED) return ok()

    const memberWithSsoSession = await ensureWorkspaceRoleAndSessionFragment(loaders)({
      userId,
      workspaceId
    })
    if (memberWithSsoSession.isErr) {
      switch (memberWithSsoSession.error.code) {
        case WorkspaceNoAccessError.code:
          return err(
            new WorkspaceNoAccessError(
              "You do not have access to this project's workspace"
            )
          )
        default:
          return err(memberWithSsoSession.error)
      }
    }

    return memberWithSsoSession
  }

/**
 * Check if project is publicly readable or not
 */
export const checkIfPubliclyReadableProjectFragment: AuthPolicyCheckFragment<
  typeof Loaders.getProject | typeof Loaders.getEnv,
  ProjectContext,
  InstanceType<typeof ProjectNotFoundError>
> =
  (loaders) =>
  async ({ projectId }) => {
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    return ok(await isPubliclyReadableProject(loaders)({ projectId }))
  }

/**
 * Ensure user has implicit/explicit project membership and read access
 */
export const ensureImplicitProjectMemberWithReadAccessFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getAdminOverrideEnabled,
  MaybeUserContext &
    ProjectContext & {
      /**
       * Optionally specify role the user should have
       */
      role?: StreamRoles
    },
  InstanceType<
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof ProjectNotEnoughPermissionsError
    | typeof WorkspaceNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId, role }) => {
    // Ensure user is authed
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // Check if user has admin override enabled
    const isAdminOverrideEnabled = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (isAdminOverrideEnabled.isErr) {
      return err(isAdminOverrideEnabled.error)
    }
    if (isAdminOverrideEnabled.value) return ok()

    // And ensure (implicit/explicit) project role
    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    // No god mode, ensure workspace access
    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    return ok()
  }

/**
 * Ensure user has implicit/explicit project membership and write access
 */
export const ensureImplicitProjectMemberWithWriteAccessFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext &
    ProjectContext & {
      /**
       * By default assumes Contributor+ for any writes, but some operations
       * may allow for lower roles (e.g. comments)
       */
      role?: StreamRoles
    },
  InstanceType<
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof WorkspaceNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId, role }) => {
    const requiredProjectRole = role || Roles.Stream.Contributor
    const requiredServerRole =
      requiredProjectRole === Roles.Stream.Owner
        ? Roles.Server.User
        : Roles.Server.Guest

    // Ensure user is authed
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: requiredServerRole
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // And ensure (implicit/explicit) project role
    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role: requiredProjectRole
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    // Ensure workspace access
    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    return ok()
  }

/**
 * Ensure project is workspaced and has access to a specific plan feature
 */
export const ensureCanUseProjectWorkspacePlanFeatureFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getEnv | typeof Loaders.getProject | typeof Loaders.getWorkspacePlan,
  ProjectContext & {
    feature: WorkspacePlanFeatures
    /**
     * Whether to also allow if project is not workspaced at all
     * Default: false
     */
    allowUnworkspaced?: boolean
  },
  InstanceType<
    | typeof WorkspacesNotEnabledError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceReadOnlyError
    | typeof WorkspacePlanNoFeatureAccessError
  >
> =
  (loaders) =>
  async ({ projectId, feature, allowUnworkspaced = false }) => {
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    const workspaceId = project.workspaceId
    if (!workspaceId) {
      if (allowUnworkspaced) return ok()

      return err(
        new WorkspaceNoAccessError({
          message: 'The project must be in a workspace'
        })
      )
    }

    const canUseFeature = await ensureCanUseWorkspacePlanFeatureFragment(loaders)({
      workspaceId,
      feature
    })
    if (canUseFeature.isErr) return err(canUseFeature.error)
    return ok()
  }
