import gql from 'graphql-tag'

const basicProjectAccessRequestFragment = gql`
  fragment BasicProjectAccessRequestFields on ProjectAccessRequest {
    id
    requester {
      id
      name
    }
    requesterId
    projectId
    createdAt
  }
`

export const createProjectAccessRequestMutation = gql`
  mutation CreateProjectAccessRequest($projectId: String!) {
    projectMutations {
      accessRequestMutations {
        create(projectId: $projectId) {
          ...BasicProjectAccessRequestFields
        }
      }
    }
  }

  ${basicProjectAccessRequestFragment}
`

export const getActiveUserProjectAccessRequestQuery = gql`
  query GetActiveUserProjectAccessRequest($projectId: String!) {
    activeUser {
      projectAccessRequest(projectId: $projectId) {
        ...BasicProjectAccessRequestFields
      }
    }
  }

  ${basicProjectAccessRequestFragment}
`

export const getActiveUserFullProjectAccessRequestQuery = gql`
  query GetActiveUserFullProjectAccessRequest($projectId: String!) {
    activeUser {
      projectAccessRequest(projectId: $projectId) {
        ...BasicProjectAccessRequestFields
        project {
          id
          name
        }
      }
    }
  }

  ${basicProjectAccessRequestFragment}
`

export const getPendingProjectAccessRequestsQuery = gql`
  query GetPendingProjectAccessRequests($projectId: String!) {
    project(id: $projectId) {
      id
      name
      pendingAccessRequests {
        ...BasicProjectAccessRequestFields
        project {
          id
          name
        }
      }
    }
  }

  ${basicProjectAccessRequestFragment}
`

export const useProjectAccessRequestMutation = gql`
  mutation UseProjectAccessRequest(
    $requestId: String!
    $accept: Boolean!
    $role: StreamRole! = STREAM_CONTRIBUTOR
  ) {
    projectMutations {
      accessRequestMutations {
        use(requestId: $requestId, accept: $accept, role: $role) {
          id
        }
      }
    }
  }
`
