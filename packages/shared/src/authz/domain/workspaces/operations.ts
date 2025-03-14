import { WorkspaceRoles } from '../../../core/constants.js'
import { FeatureFlags } from '../../../environment/index.js'
import { Workspace, WorkspaceSsoProvider, WorkspaceSsoSession } from './types.js'

export type GetWorkspace = (args: { workspaceId: string }) => Promise<Workspace | null>

export type GetWorkspaceRole = (args: {
  userId: string
  workspaceId: string
}) => Promise<WorkspaceRoles | null>

export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<WorkspaceSsoProvider | null>

export type GetWorkspaceSsoSession = (args: {
  userId: string
  workspaceId: string
}) => Promise<WorkspaceSsoSession | null>

export type GetEnv = () => FeatureFlags
