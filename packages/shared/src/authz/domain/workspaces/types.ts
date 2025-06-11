import { WorkspaceRoles } from '../../../core/constants.js'

export type Workspace = {
  id: string
  slug: string
  isExclusive: boolean
  role?: WorkspaceRoles | null
}

export type WorkspaceSsoProvider = {
  providerId: string
}

export type WorkspaceSsoSession = {
  userId: string
  providerId: string
  validUntil: Date
}
