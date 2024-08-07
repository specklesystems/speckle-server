import { WorkspaceRoles } from '@speckle/shared'

export type Workspace = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  logo: string | null
  domains: WorkspaceDomain[]
}

export type WorkspaceDomain = {
  id: string
  workspaceId: string
  domain: string
  createdAt: Date
  updatedAt: Date
  createdByUserId: string | null
  verified: boolean
}

export type WorkspaceWithOptionalRole = Workspace & { role?: WorkspaceRoles }

export type WorkspaceAcl = { userId: string; role: WorkspaceRoles; workspaceId: string }
