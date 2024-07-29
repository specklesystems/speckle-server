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

export const createWorkspaceInviteQuery = gql`
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

export const batchCreateWorkspaceInvitesQuery = gql`
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

export const getWorkspaceWithTeamQuery = gql`
  query GetWorkspaceWithTeam($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      invitedTeam {
        ...BasicPendingWorkspaceCollaborator
      }
    }
  }

  ${basicWorkspaceFragment}
  ${basicPendingWorkspaceCollaboratorFragment}
`

export const cancelInviteMutation = gql`
  mutation CancelWorkspaceInvite($workspaceId: String!, $inviteId: String!) {
    workspaceMutations {
      invites {
        cancel(workspaceId: $workspaceId, inviteId: $inviteId) {
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
export const useInviteMutation = gql`
  mutation UseWorkspaceInvite($input: WorkspaceInviteUseInput!) {
    workspaceMutations {
      invites {
        use(input: $input)
      }
    }
  }
`

export const getWorkspaceInviteQuery = gql`
  query GetWorkspaceInvite($workspaceId: String!, $token: String) {
    workspaceInvite(workspaceId: $workspaceId, token: $token) {
      ...BasicPendingWorkspaceCollaborator
    }
  }

  ${basicPendingWorkspaceCollaboratorFragment}
`

export const getMyWorkspaceInvitesQuery = gql`
  query GetMyWorkspaceInvites {
    activeUser {
      workspaceInvites {
        ...BasicPendingWorkspaceCollaborator
      }
    }
  }

  ${basicPendingWorkspaceCollaboratorFragment}
`

export const createWorkspaceProjectInviteMutation = gql`
  mutation UseWorkspaceProjectInvite($input: ProjectInviteUseInput!) {
    projectMutations {
      invites {
        use(input: $input)
      }
    }
  }
`
