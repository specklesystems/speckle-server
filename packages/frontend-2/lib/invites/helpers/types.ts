import type { ServerRoles, WorkspaceRoles, StreamRoles } from '@speckle/shared'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

export type InviteServerItem = {
  email: string
  serverRole: ServerRoles
  project?: FormSelectProjects_ProjectFragment
}

export interface InviteServerForm {
  fields: InviteServerItem[]
}

export type InviteGenericItem = {
  email: string
  projectRole?: StreamRoles
  workspaceRole?: WorkspaceRoles
  needsWorkspaceRole?: boolean
  serverRole?: ServerRoles
  needsServerRole?: boolean
  matchesDomainPolicy?: boolean
  userId?: string
}

export interface InviteGenericForm {
  fields: InviteGenericItem[]
}
