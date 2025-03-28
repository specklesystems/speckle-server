import Result from 'true-myth/result'
import { WorkspaceRoles, WorkspaceSeatType } from '../../../core/constants.js'
import { FeatureFlags } from '../../../environment/index.js'
import { Workspace, WorkspaceSsoProvider, WorkspaceSsoSession } from './types.js'
import {
  WorkspaceNoAccessError,
  WorkspaceNotFoundError,
  WorkspaceRoleNotFoundError,
  WorkspaceSeatNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceSsoSessionNotFoundError
} from '../authErrors.js'

export type GetWorkspace = (args: {
  workspaceId: string
}) => Promise<
  Result<
    Workspace,
    | InstanceType<typeof WorkspaceNotFoundError>
    | InstanceType<typeof WorkspaceNoAccessError>
    | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  >
>

export type GetWorkspaceRole = (args: {
  userId: string
  workspaceId: string
}) => Promise<Result<WorkspaceRoles, InstanceType<typeof WorkspaceRoleNotFoundError>>>

export type GetWorkspaceSeat = (args: {
  userId: string
  workspaceId: string
}) => Promise<
  Result<WorkspaceSeatType, InstanceType<typeof WorkspaceSeatNotFoundError>>
>

export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<
  Result<WorkspaceSsoProvider, InstanceType<typeof WorkspaceSsoProviderNotFoundError>>
>

export type GetWorkspaceSsoSession = (args: {
  userId: string
  workspaceId: string
}) => Promise<
  Result<WorkspaceSsoSession, InstanceType<typeof WorkspaceSsoSessionNotFoundError>>
>

export type GetEnv = () => Promise<FeatureFlags>
