import { gql } from 'apollo-server-express'

export const workspaceFragment = gql`
  fragment TestWorkspace on Workspace {
    id
    name
    description
    createdAt
    updatedAt
    logoUrl
  }
`

export const workspaceTeamFragment = gql`
  fragment TestWorkspaceTeam on Workspace {
    team {
      id
      role
    }
  }
`

export const createWorkspaceQuery = gql`
  mutation CreateWorkspace($input: WorkspaceCreateInput!) {
    workspaceMutations {
      create(input: $input) {
        ...TestWorkspace
      }
    }
  }
  ${workspaceFragment}
`

export const getWorkspaceQuery = gql`
  query GetWorkspace($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...TestWorkspace
      ...TestWorkspaceTeam
    }
  }
  ${workspaceFragment}
  ${workspaceTeamFragment}
`

export const updateWorkspaceQuery = gql`
  mutation UpdateWorkspace($input: WorkspaceUpdateInput!) {
    workspaceMutations {
      update(input: $input) {
        ...TestWorkspace
      }
    }
  }
  ${workspaceFragment}
`

export const getActiveUserWorkspacesQuery = gql`
  query GetActiveUserWorkspaces {
    activeUser {
      workspaces {
        items {
          ...TestWorkspace
        }
      }
    }
  }
  ${workspaceFragment}
`

export const updateWorkspaceRoleQuery = gql`
  mutation UpdateWorkspaceRole($input: WorkspaceRoleUpdateInput!) {
    workspaceMutations {
      updateRole(input: $input)
    }
  }
`

export const deleteWorkspaceRoleQuery = gql`
  mutation DeleteWorkspaceRole($input: WorkspaceRoleDeleteInput!) {
    workspaceMutations {
      deleteRole(input: $input)
    }
  }
`
