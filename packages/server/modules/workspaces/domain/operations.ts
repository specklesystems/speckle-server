import {
  WorkspaceEvents,
  WorkspaceEventsPayloads
} from '@/modules/workspacesCore/domain/events'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'

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

export type UpsertWorkspaceRole = (args: WorkspaceAcl) => Promise<void>

type GetWorkspaceRoleArgs = {
  workspaceId: string
  userId: string
}

export type GetWorkspaceRole = (
  args: GetWorkspaceRoleArgs
) => Promise<WorkspaceAcl | null>

/** Blob */

export type StoreBlob = (args: string) => Promise<string>

/** Events */

export type EmitWorkspaceEvent = <TEvent extends WorkspaceEvents>(args: {
  event: TEvent
  payload: WorkspaceEventsPayloads[TEvent]
}) => Promise<unknown[]>
