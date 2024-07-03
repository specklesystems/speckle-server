import {
  WorkspaceEvents,
  WorkspaceEventsPayloads
} from '@/modules/workspacesCore/domain/events'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { WorkspaceRoles } from '@speckle/shared'
import { StreamRecord } from '@/modules/core/helpers/types'

/** Workspace */

type UpsertWorkspaceArgs = {
  workspace: Workspace
}

export type UpsertWorkspace = (args: UpsertWorkspaceArgs) => Promise<void>

type GetWorkspaceArgs = {
  workspaceId: string
}

export type GetWorkspace = (args: GetWorkspaceArgs) => Promise<Workspace | null>

/** WorkspaceRole */

type DeleteWorkspaceRoleArgs = {
  workspaceId: string
  userId: string
}

export type DeleteWorkspaceRole = (
  args: DeleteWorkspaceRoleArgs
) => Promise<WorkspaceAcl | null>

type GetWorkspaceRoleArgs = {
  workspaceId: string
  userId: string
}

export type GetWorkspaceRole = (
  args: GetWorkspaceRoleArgs
) => Promise<WorkspaceAcl | null>

type GetWorkspaceRolesArgs = {
  workspaceId: string
  roles: WorkspaceRoles[]
}

export type GetWorkspaceRoles = (args: GetWorkspaceRolesArgs) => Promise<WorkspaceAcl[]>

export type UpsertWorkspaceRole = (args: WorkspaceAcl) => Promise<void>

/** Workspace Projects */

type GetWorkspaceProjectsArgs = {
  workspaceId: string
}

export type GetWorkspaceProjects = (
  args: GetWorkspaceProjectsArgs
) => Promise<StreamRecord[]>

/** Blob */

export type StoreBlob = (args: string) => Promise<string>

/** Events */

export type EmitWorkspaceEvent = <TEvent extends WorkspaceEvents>(args: {
  event: TEvent
  payload: WorkspaceEventsPayloads[TEvent]
}) => Promise<unknown[]>
