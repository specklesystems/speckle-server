import { WorkspaceRoles } from '@speckle/shared'

export type Workspace = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  logo: string | null
  defaultLogoIndex: number
}

export type WorkspaceWithOptionalRole = Workspace & { role?: WorkspaceRoles }

export type WorkspaceAcl = {
  userId: string
  role: WorkspaceRoles
  workspaceId: string
}

export type WorkspaceAclUpdate = WorkspaceAcl & {
  // Unique id for this update record
  id: string
  updatedAt: Date
}
