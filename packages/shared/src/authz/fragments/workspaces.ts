import { err, ok } from 'true-myth/result'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import {
  hasAnyWorkspaceRole,
  hasMinimumWorkspaceRole
} from '../checks/workspaceRole.js'
import {
  ProjectNotFoundError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { Loaders } from '../domain/loaders.js'
import { Roles, WorkspaceRoles } from '../../core/constants.js'
import {
  MaybeUserContext,
  MaybeWorkspaceContext,
  ProjectContext,
  WorkspaceContext
} from '../domain/context.js'
import { isWorkspacePlanStatusReadOnly } from '../../workspaces/helpers/plans.js'
import { hasEditorSeat } from '../checks/workspaceSeat.js'

/**
 * Ensure user has a workspace role, and a valid SSO session (if SSO is configured)
 */
export const ensureWorkspaceRoleAndSessionFragment: AuthPolicyEnsureFragment<
  | 'getWorkspaceRole'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession'
  | 'getWorkspace',
  { userId: string; workspaceId: string; role?: WorkspaceRoles },
  InstanceType<
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, workspaceId, role }) => {
    const testedRole = role ?? Roles.Workspace.Guest
    const testingForMinimumRole = testedRole === Roles.Workspace.Guest

    // Get workspace, so we can resolve its slug for error scenarios
    const workspace = await loaders.getWorkspace({ workspaceId })
    // hides the fact, that the workspace does not exist
    if (!workspace) return err(new WorkspaceNoAccessError())

    const hasMinimumRole = await hasMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: testedRole
    })
    if (!hasMinimumRole)
      return err(
        testingForMinimumRole
          ? new WorkspaceNoAccessError()
          : new WorkspaceNotEnoughPermissionsError()
      )

    const hasMinimumMemberRole = await hasMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: 'workspace:member'
    })
    // only members and above need to use sso
    if (!hasMinimumMemberRole) return ok()

    const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
      workspaceId
    })
    if (!workspaceSsoProvider) return ok()

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })
    if (!workspaceSsoSession)
      return err(
        new WorkspaceSsoSessionNoAccessError({
          payload: { workspaceSlug: workspace.slug }
        })
      )

    const isExpiredSession =
      new Date().getTime() > workspaceSsoSession.validUntil.getTime()

    if (isExpiredSession)
      return err(
        new WorkspaceSsoSessionNoAccessError({
          payload: { workspaceSlug: workspace.slug }
        })
      )

    return ok()
  }

/**
 * Ensure the workspaces module is enabled
 */
export const ensureWorkspacesEnabledFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getEnv,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  InstanceType<typeof WorkspacesNotEnabledError>
> = (loaders) => async () => {
  const env = await loaders.getEnv()
  if (!env.FF_WORKSPACES_MODULE_ENABLED) return err(new WorkspacesNotEnabledError())
  return ok()
}

/**
 * Ensure workspace is not read-only
 */
export const ensureWorkspaceNotReadOnlyFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getWorkspacePlan,
  WorkspaceContext,
  InstanceType<typeof WorkspaceNoAccessError | typeof WorkspaceReadOnlyError>
> =
  (loaders) =>
  async ({ workspaceId }) => {
    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())
    if (isWorkspacePlanStatusReadOnly(workspacePlan.status))
      return err(new WorkspaceReadOnlyError())

    return ok()
  }

/**
 * Ensure workspace can accept new project (not read-only, limits not reached).
 * If userId is specified, will also check for user role & seat
 */
export const ensureWorkspaceProjectCanBeCreatedFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceSeat
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspaceLimits
  | typeof Loaders.getWorkspaceProjectCount,
  WorkspaceContext & MaybeUserContext,
  InstanceType<
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceReadOnlyError
    | typeof WorkspaceLimitsReachedError
    | typeof WorkspaceNoEditorSeatError
    | typeof WorkspaceNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ workspaceId, userId }) => {
    // First check user even has access
    if (userId) {
      // Is Member+
      const isNotGuest = await hasMinimumWorkspaceRole(loaders)({
        userId,
        workspaceId,
        role: Roles.Workspace.Member
      })
      if (!isNotGuest) {
        return err(
          new WorkspaceNotEnoughPermissionsError(
            'Guests cannot create projects in the workspace'
          )
        )
      }
    }

    const ensuredNotReadOnly = await ensureWorkspaceNotReadOnlyFragment(loaders)({
      workspaceId
    })
    if (ensuredNotReadOnly.isErr) return err(ensuredNotReadOnly.error)

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())

    // Now check editor seat
    if (userId) {
      const isEditor = await hasEditorSeat(loaders)({
        userId,
        workspaceId
      })
      if (!isEditor) return err(new WorkspaceNoEditorSeatError())
    }

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    // no limits imposed
    if (workspaceLimits.projectCount === null) return ok()
    const currentProjectCount = await loaders.getWorkspaceProjectCount({
      workspaceId
    })

    // this will not happen in practice
    if (currentProjectCount === null) return err(new WorkspaceNoAccessError())

    return currentProjectCount < workspaceLimits.projectCount
      ? ok()
      : err(
          new WorkspaceLimitsReachedError({
            message:
              'You have reached the maximum number of projects for your plan. Upgrade to increase it.',
            payload: { limit: 'projectCount' }
          })
        )
  }

/**
 * Ensure model can be created (workspace not read-only, limits not reached).
 * If userId is specified, will also check for appropriate user role & seat
 */
export const ensureModelCanBeCreatedFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspaceLimits
  | typeof Loaders.getProject
  | typeof Loaders.getWorkspaceModelCount,
  ProjectContext &
    MaybeWorkspaceContext &
    MaybeUserContext & {
      /**
       * How many models we're testing being added. Defaults to 1
       */
      addedModelCount?: number
    },
  InstanceType<
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceReadOnlyError
    | typeof WorkspaceLimitsReachedError
    | typeof ProjectNotFoundError
  >
> =
  (loaders) =>
  async ({ projectId, userId, addedModelCount, workspaceId }) => {
    addedModelCount = addedModelCount ?? 1
    const project = await loaders.getProject({ projectId })
    if (!project) return err(new ProjectNotFoundError())

    // Project may not be attached to a workspace yet, then we use the specified workspaceId
    workspaceId = workspaceId || project.workspaceId || undefined
    if (!workspaceId) return ok()

    if (userId) {
      // Has workspace role
      const isInWorkspace = await hasAnyWorkspaceRole(loaders)({
        userId,
        workspaceId
      })
      if (!isInWorkspace) {
        return err(new WorkspaceNoAccessError())
      }
    }

    const ensuredNotReadOnly = await ensureWorkspaceNotReadOnlyFragment(loaders)({
      workspaceId
    })
    if (ensuredNotReadOnly.isErr) return err(ensuredNotReadOnly.error)

    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan) return err(new WorkspaceNoAccessError())

    const workspaceLimits = await loaders.getWorkspaceLimits({ workspaceId })
    if (!workspaceLimits) return err(new WorkspaceNoAccessError())

    if (workspaceLimits.modelCount === null) return ok()

    const currentModelCount = await loaders.getWorkspaceModelCount({ workspaceId })

    if (currentModelCount === null) return err(new WorkspaceNoAccessError())

    return currentModelCount + addedModelCount <= workspaceLimits.modelCount
      ? ok()
      : err(
          new WorkspaceLimitsReachedError({
            message:
              'You have reached the maximum number of models for your plan. Upgrade to increase it.',
            payload: {
              limit: 'modelCount'
            }
          })
        )
  }
