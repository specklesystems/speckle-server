import Result from 'true-myth/result'
import { WorkspaceRoles } from '../../../core/constants.js'
import { FeatureFlags } from '../../../environment/index.js'
import { Workspace, WorkspaceSsoProvider, WorkspaceSsoSession } from './types.js'
import {
  WorkspaceNotFoundError,
  WorkspaceRoleNotFoundError,
  WorkspaceSsoProviderNotFoundError,
  WorkspaceSsoSessionNotFoundError
} from '../authErrors.js'

export type GetWorkspace = (args: {
  workspaceId: string
}) => Promise<Result<Workspace, typeof WorkspaceNotFoundError>>

export type GetWorkspaceRole = (args: {
  userId: string
  workspaceId: string
}) => Promise<Result<WorkspaceRoles, typeof WorkspaceRoleNotFoundError>>

export type GetWorkspaceSsoProvider = (args: {
  workspaceId: string
}) => Promise<Result<WorkspaceSsoProvider, typeof WorkspaceSsoProviderNotFoundError>>

export type GetWorkspaceSsoSession = (args: {
  userId: string
  workspaceId: string
}) => Promise<Result<WorkspaceSsoSession, typeof WorkspaceSsoSessionNotFoundError>>

export type GetEnv = () => Promise<FeatureFlags>
