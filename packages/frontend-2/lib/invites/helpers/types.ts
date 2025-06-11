import type {
  ServerRoles,
  WorkspaceRoles,
  StreamRoles,
  WorkspaceSeatType,
  MaybeNullOrUndefined
} from '@speckle/shared'
import { graphql } from '~/lib/common/generated/gql'
import type {
  FormSelectProjects_ProjectFragment,
  InviteProjectItem_WorkspaceCollaboratorFragment
} from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment InviteProjectItem_WorkspaceCollaborator on WorkspaceCollaborator {
    id
    user {
      id
      name
    }
    seatType
    role
  }
`)

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
  userInfo: MaybeNullOrUndefined<InviteProjectItem_WorkspaceCollaboratorFragment>
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
