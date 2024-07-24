import { gql } from 'apollo-server-express'

export const basicWorkspaceFragment = gql`
  fragment BasicWorkspace on Workspace {
    id
    name
    updatedAt
    createdAt
    role
  }
`

export const basicPendingWorkspaceCollaboratorFragment = gql`
  fragment BasicPendingWorkspaceCollaborator on PendingWorkspaceCollaborator {
    id
    inviteId
    workspaceId
    workspaceName
    title
    role
    invitedBy {
      id
      name
    }
    user {
      id
      name
    }
    token
  }
`

export const createWorkspaceInvite = gql`
  mutation CreateWorkspaceInvite(
    $workspaceId: String!
    $input: WorkspaceInviteCreateInput!
  ) {
    workspaceMutations {
      invites {
        create(workspaceId: $workspaceId, input: $input) {
          ...BasicWorkspace
          invitedTeam {
            ...BasicPendingWorkspaceCollaborator
          }
        }
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`

export const batchCreateWorkspaceInvites = gql`
  mutation BatchCreateWorkspaceInvites(
    $workspaceId: String!
    $input: [WorkspaceInviteCreateInput!]!
  ) {
    workspaceMutations {
      invites {
        batchCreate(workspaceId: $workspaceId, input: $input) {
          ...BasicWorkspace
          invitedTeam {
            ...BasicPendingWorkspaceCollaborator
          }
        }
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`
