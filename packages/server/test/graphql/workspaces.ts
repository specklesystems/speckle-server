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

export const workspaceProjectFragment = gql`
  fragment TestWorkspaceProject on Project {
    id
    name
    description
    createdAt
    updatedAt
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
    }
  }
  ${workspaceFragment}
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
