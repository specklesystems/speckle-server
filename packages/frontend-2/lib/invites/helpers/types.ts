import type {
  ServerRoles,
  WorkspaceRoles,
  StreamRoles,
  WorkspaceSeatType
} from '@speckle/shared'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

// Server
export type InviteServerItem = {
  email: string
  serverRole: ServerRoles
  project?: FormSelectProjects_ProjectFragment
}

export interface InviteServerForm {
  fields: InviteServerItem[]
}

// Project
export type InviteProjectItem = {
  email: string
  userId?: string
  projectRole?: StreamRoles
  project?: FormSelectProjects_ProjectFragment
  serverRole?: ServerRoles
}

export interface InviteProjectForm {
  fields: InviteProjectItem[]
}

// Workspace
export type InviteWorkspaceItem = {
  email: string
  seatType?: WorkspaceSeatType
  workspaceRole?: WorkspaceRoles
  projectRole?: StreamRoles
  serverRole?: ServerRoles
  matchesDomainPolicy?: boolean
}

export interface InviteWorkspaceForm {
  fields: InviteWorkspaceItem[]
}
