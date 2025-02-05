import gql from 'graphql-tag'

export const basicProjectFieldsFragment = gql`
  fragment BasicProjectFields on Project {
    id
    name
    description
    visibility
    allowPublicComments
    role
    createdAt
    updatedAt
  }
`

export const adminProjectListQuery = gql`
  query AdminProjectList(
    $query: String
    $orderBy: String
    $visibility: String
    $limit: Int! = 25
    $cursor: String = null
  ) {
    admin {
      projectList(
        query: $query
        orderBy: $orderBy
        visibility: $visibility
        limit: $limit
        cursor: $cursor
      ) {
        cursor
        totalCount
        items {
          ...BasicProjectFields
        }
      }
    }
  }

  ${basicProjectFieldsFragment}
`

export const getProjectObjectQuery = gql`
  query GetProjectObject($projectId: String!, $objectId: String!) {
    project(id: $projectId) {
      object(id: $objectId) {
        id
        createdAt
      }
    }
  }
`

export const getProjectQuery = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      workspaceId
    }
  }
`

export const createProjectMutation = gql`
  mutation CreateProject($input: ProjectCreateInput!) {
    projectMutations {
      create(input: $input) {
        ...BasicProjectFields
      }
    }
  }

  ${basicProjectFieldsFragment}
`

export const batchDeleteProjectsMutation = gql`
  mutation BatchDeleteProjects($ids: [String!]!) {
    projectMutations {
      batchDelete(ids: $ids)
    }
  }
`
