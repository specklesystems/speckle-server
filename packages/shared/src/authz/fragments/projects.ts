import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext, UserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import {
  AuthPolicyCheckFragment,
  AuthPolicyEnsureFragment
} from '../domain/policies.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { Roles, StreamRoles } from '../../core/constants.js'
import { isMinimumProjectRole } from '../domain/logic/roles.js'
import { hasMinimumProjectRole, isPubliclyReadableProject } from '../checks/projects.js'
import { ensureWorkspaceRoleAndSessionFragment } from './workspaces.js'
import {
  checkIfAdminOverrideEnabledFragment,
  ensureMinimumServerRoleFragment
} from './server.js'

const workspaceRoleImplicitProjectRoleMap = <const>{
  [Roles.Workspace.Admin]: Roles.Stream.Owner,
  [Roles.Workspace.Member]: Roles.Stream.Reviewer,
  [Roles.Workspace.Guest]: null
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
    | typeof WorkspaceNoAccessError
  >
> =
  (loaders) =>
  async ({ userId, projectId, role, explicit }) => {
    const requiredProjectRole = role || Roles.Stream.Reviewer
    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    const { workspaceId } = project
    if (env.FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // Check for implicit workspace project role
      const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
      if (!userWorkspaceRole) return err(new WorkspaceNoAccessError())

      const implicitProjectRole = explicit
        ? null
        : workspaceRoleImplicitProjectRoleMap[userWorkspaceRole]
      if (implicitProjectRole) {
        // Does it fit minimum?
        if (isMinimumProjectRole(implicitProjectRole, requiredProjectRole)) return ok()
      }
    }

    // Check explicit project role
    return (await hasMinimumProjectRole(loaders)({
      userId,
      projectId,
      role: requiredProjectRole
    }))
      ? ok()
      : err(new ProjectNoAccessError())
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
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
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

    // No god mode, ensure workspace access
    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // And ensure (implicit/explicit) project role
    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    return ok()
  }
