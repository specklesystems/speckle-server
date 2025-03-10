import { WorkspaceRole } from './types.js'

export type GetWorkspaceRole = (args: {
  userId: string
  workspaceId: string
}) => Promise<WorkspaceRole | null>
