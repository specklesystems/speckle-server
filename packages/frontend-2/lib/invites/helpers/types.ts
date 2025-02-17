import type { ServerRoles, WorkspaceRoles, StreamRoles } from '@speckle/shared'
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
  serverRole: ServerRoles
  projectRole?: StreamRoles
  project?: FormSelectProjects_ProjectFragment
}

export interface InviteProjectForm {
  fields: InviteProjectItem[]
}

// Workspace
export type InviteGenericItem = {
  email: string
  workspaceRole?: WorkspaceRoles
  projectRole?: StreamRoles
  serverRole?: ServerRoles
  matchesDomainPolicy?: boolean
}

export interface InviteGenericForm {
  fields: InviteGenericItem[]
}
