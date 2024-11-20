import gql from 'graphql-tag'

export const workspaceFragment = gql`
  fragment TestWorkspace on Workspace {
    id
    name
    slug
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
    user {
      name
    }
    projectRoles {
      role
      project {
        id
        name
      }
    }
  }
`

export const workspaceProjectFragment = gql`
  fragment TestWorkspaceProject on Project {
    id
    name
    createdAt
    updatedAt
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

export const deleteWorkspaceQuery = gql`
  mutation DeleteWorkspace($workspaceId: String!) {
    workspaceMutations {
      delete(workspaceId: $workspaceId)
    }
  }
`

export const getWorkspaceQuery = gql`
  query GetWorkspace($workspaceId: String!) {
    workspace(id: $workspaceId) {
      ...TestWorkspace
      team {
        items {
          ...TestWorkspaceCollaborator
        }
      }
    }
  }
  ${workspaceFragment}
  ${workspaceCollaboratorFragment}
`

export const getWorkspaceBySlugQuery = gql`
  query GetWorkspaceBySlug($workspaceSlug: String!) {
    workspaceBySlug(slug: $workspaceSlug) {
      ...TestWorkspace
      team {
        items {
          ...TestWorkspaceCollaborator
        }
      }
    }
  }
  ${workspaceFragment}
  ${workspaceCollaboratorFragment}
`

export const getActiveUserDiscoverableWorkspacesQuery = gql`
  query getActiveUserDiscoverableWorkspaces {
    activeUser {
      discoverableWorkspaces {
        id
        name
        description
      }
    }
  }
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
          items {
            ...TestWorkspaceCollaborator
          }
        }
      }
    }
  }
  ${workspaceCollaboratorFragment}
`

export const createWorkspaceProjectQuery = gql`
  mutation CreateWorkspaceProject($input: WorkspaceProjectCreateInput!) {
    workspaceMutations {
      projects {
        create(input: $input) {
          ...TestWorkspaceProject
        }
      }
    }
  }
  ${workspaceProjectFragment}
`

export const getWorkspaceProjectsQuery = gql`
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

export const getWorkspaceSsoQuery = gql`
  query GetWorkspaceSso($id: String!) {
    workspace(id: $id) {
      sso {
        provider {
          id
          name
        }
        session {
          createdAt
          validUntil
        }
      }
    }
  }
`

export const getWorkspaceTeamQuery = gql`
  query GetWorkspaceTeam(
    $workspaceId: String!
    $filter: WorkspaceTeamFilter
    $limit: Int
    $cursor: String
  ) {
    workspace(id: $workspaceId) {
      team(filter: $filter, limit: $limit, cursor: $cursor) {
        items {
          ...TestWorkspaceCollaborator
        }
        cursor
        totalCount
      }
    }
  }
  ${workspaceCollaboratorFragment}
`

export const leaveWorkspaceMutation = gql`
  mutation ActiveUserLeaveWorkspace($id: ID!) {
    workspaceMutations {
      leave(id: $id)
    }
  }
`

export const getProjectWorkspaceQuery = gql`
  query ActiveUserProjectsWorkspace {
    activeUser {
      projects {
        items {
          id
          workspace {
            id
            name
          }
        }
      }
    }
  }
`

export const getActiveUserExpiredSsoSessions = gql`
  query ActiveUserExpiredSsoSessions {
    activeUser {
      expiredSsoSessions {
        id
        slug
      }
    }
  }
`

export const moveProjectToWorkspaceMutation = gql`
  mutation MoveProjectToWorkspace($projectId: String!, $workspaceId: String!) {
    workspaceMutations {
      projects {
        moveToWorkspace(projectId: $projectId, workspaceId: $workspaceId) {
          id
          workspaceId
          team {
            id
            role
          }
        }
      }
    }
  }
`
