import { WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'

export const WorkspaceInviteResourceType = 'workspace'

// Note: We are considering making this an editor seat
export const WorkspaceDefaultSeatType: WorkspaceSeatType = WorkspaceSeatType.Viewer
