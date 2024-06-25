import { WorkspaceRoles } from "@speckle/shared"

export type Workspace = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  // the user who created it, might not be a server user any more
  createdByUserId: string | null
  logoUrl: string | null
}

export type WorkspaceAcl = { userId: string; role: WorkspaceRoles; workspaceId: string }

