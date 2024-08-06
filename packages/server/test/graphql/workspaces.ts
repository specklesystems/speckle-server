import { gql } from 'apollo-server-express'

export const workspaceFragment = gql`
  fragment TestWorkspace on Workspace {
    id
    name
    description
    createdAt
    updatedAt
    logo
  }
`

export const workspaceCollaboratorFragment = gql`
  fragment TestWorkspaceCollaborator on WorkspaceCollaborator {
    id
    role
  }
`

export const workspaceProjectFragment = gql`
  fragment TestWorkspaceProject on Project {
    id
    name
    createdAt
    updatedAt
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
      updateRole(input: $input) {
        team {
          id
          role
        }
      }
    }
  }
`

export const createWorkspaceProjectQuery = gql`
  mutation CreateWorkspaceProject($input: ProjectCreateInput!) {
    projectMutations {
      create(input: $input) {
        ...TestWorkspaceProject
      }
    }
  }
  ${workspaceProjectFragment}
`

export const getWorkspaceProjects = gql`
  query GetWorkspaceProjects(
    $id: String!
    $limit: Int
    $cursor: String
    $filter: WorkspaceProjectsFilter
  ) {
    workspace(id: $id) {
      projects(limit: $limit, cursor: $cursor, filter: $filter) {
        items {
          ...TestWorkspaceProject
        }
        cursor
        totalCount
      }
    }
  }
  ${workspaceProjectFragment}
`

export const getWorkspaceTeam = gql`
  query GetWorkspaceTeam($workspaceId: String!, $filter: WorkspaceTeamFilter) {
    workspace(id: $workspaceId) {
      team(filter: $filter) {
        ...TestWorkspaceCollaborator
      }
    }
  }
  ${workspaceCollaboratorFragment}
`
