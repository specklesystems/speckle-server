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

export const workspaceBillingFragment = gql`
  fragment WorkspaceBilling on Workspace {
    billing {
      versionsCount {
        current
        max
      }
      cost {
        subTotal
        currency
        items {
          count
          name
          cost
        }
      }
    }
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

export const getWorkspaceWithBillingQuery = gql`
  query GetWorkspaceWithBilling($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...BasicWorkspace
      ...WorkspaceBilling
    }
  }

  ${basicWorkspaceFragment}
  ${workspaceBillingFragment}
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

export const useWorkspaceProjectInviteMutation = gql`
  mutation UseWorkspaceProjectInvite($input: ProjectInviteUseInput!) {
    projectMutations {
      invites {
        use(input: $input)
      }
    }
  }
`

export const createWorkspaceProjectInviteMutation = gql`
  mutation CreateWorkspaceProjectInvite(
    $projectId: ID!
    $inputs: [WorkspaceProjectInviteCreateInput!]!
  ) {
    projectMutations {
      invites {
        createForWorkspace(projectId: $projectId, inputs: $inputs) {
          id
        }
      }
    }
  }
`

export const resendWorkspaceInviteMutation = gql`
  mutation ResendWorkspaceInvite($input: WorkspaceInviteResendInput!) {
    workspaceMutations {
      invites {
        resend(input: $input)
      }
    }
  }
`
