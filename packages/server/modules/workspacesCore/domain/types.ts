import { WorkspaceRoles } from '@speckle/shared'

export type Workspace = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  logoUrl: string | null
}

export type WorkspaceAcl = { userId: string; role: WorkspaceRoles; workspaceId: string }
