import { WorkspaceRoles } from '@speckle/shared'

export type Workspace = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  logo: string | null
  domains: string[] | null
}

export type WorkspaceWithOptionalRole = Workspace & { role?: WorkspaceRoles }

export type WorkspaceAcl = { userId: string; role: WorkspaceRoles; workspaceId: string }
