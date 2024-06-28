import {
  WorkspaceEvents,
  WorkspaceEventsPayloads
} from '@/modules/workspaces/domain/events'
import { Workspace, WorkspaceAcl } from '@/modules/workspaces/domain/types'

export type UpsertWorkspace = (args: { workspace: Workspace }) => Promise<void>
export type GetWorkspace = (args: { workspaceId: string }) => Promise<Workspace | null>

export type UpsertWorkspaceRole = (args: WorkspaceAcl) => Promise<void>

export type StoreBlob = (args: string) => Promise<string>

export type EmitWorkspaceEvent = <TEvent extends WorkspaceEvents>(args: {
  event: TEvent
  payload: WorkspaceEventsPayloads[TEvent]
}) => Promise<unknown[]>
