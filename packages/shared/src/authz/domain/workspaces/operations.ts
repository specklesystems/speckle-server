import { WorkspaceRoles, WorkspaceSeatType } from '../../../core/constants.js'
import { FeatureFlags } from '../../../environment/featureFlags.js'
import { WorkspaceLimits } from '../../../workspaces/helpers/limits.js'
import { WorkspacePlan } from '../../../workspaces/index.js'
import { UserContext, WorkspaceContext } from '../context.js'
import { Workspace, WorkspaceSsoProvider, WorkspaceSsoSession } from './types.js'

export type GetWorkspace = (args: WorkspaceContext) => Promise<Workspace | null>

export type GetUserWorkspaces = (args: UserContext) => Promise<Workspace[]>

export type GetWorkspaceRole = (
  args: UserContext & WorkspaceContext
) => Promise<WorkspaceRoles | null>

export type GetWorkspaceLimits = (
  args: WorkspaceContext
) => Promise<WorkspaceLimits | null>

export type GetWorkspacePlan = (args: WorkspaceContext) => Promise<WorkspacePlan | null>

export type GetWorkspaceProjectCount = (
  args: WorkspaceContext
) => Promise<number | null>

export type GetWorkspaceModelCount = (args: WorkspaceContext) => Promise<number | null>

export type GetWorkspaceSeat = (
  args: UserContext & WorkspaceContext
) => Promise<WorkspaceSeatType | null>

export type GetWorkspaceSsoProvider = (
  args: WorkspaceContext
) => Promise<WorkspaceSsoProvider | null>

export type GetWorkspaceSsoSession = (
  args: UserContext & WorkspaceContext
) => Promise<WorkspaceSsoSession | null>

export type GetEnv = () => Promise<FeatureFlags>

export type GetAdminOverrideEnabled = () => Promise<boolean>
