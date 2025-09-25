import { gql } from 'graphql-tag'

export const createObjectMutation = gql`
  mutation CreateObject($input: ObjectCreateInput!) {
    objectCreate(objectInput: $input)
  }
`

export const pingPongSubscription = gql`
  subscription PingPong {
    ping
  }
`

export const onUserProjectsUpdatedSubscription = gql`
  subscription OnUserProjectsUpdated {
    userProjectsUpdated {
      id
      type
      project {
        id
        name
      }
    }
  }
`

export const onProjectUpdatedSubscription = gql`
  subscription OnProjectUpdated($projectId: String!) {
    projectUpdated(id: $projectId) {
      id
      type
      project {
        id
        name
      }
    }
  }
`

export const onUserStreamAddedSubscription = gql`
  subscription OnUserStreamAdded {
    userStreamAdded
  }
`

export const onUserStreamRemovedSubscription = gql`
  subscription OnUserStreamRemoved {
    userStreamRemoved
  }
`

export const onStreamUpdatedSubscription = gql`
  subscription OnStreamUpdated($streamId: String!) {
    streamUpdated(streamId: $streamId)
  }
`

export const onUserProjectVersionsUpdatedSubscription = gql`
  subscription OnUserProjectVersionsUpdated($projectId: String!) {
    projectVersionsUpdated(id: $projectId) {
      id
      type
      version {
        id
        message
      }
      modelId
    }
  }
`

export const onUserStreamCommitCreatedSubscription = gql`
  subscription OnUserStreamCommitCreated($streamId: String!) {
    commitCreated(streamId: $streamId)
  }
`

export const onUserStreamCommitDeletedSubscription = gql`
  subscription OnUserStreamCommitDeleted($streamId: String!) {
    commitDeleted(streamId: $streamId)
  }
`

export const onUserStreamCommitUpdatedSubscription = gql`
  subscription OnUserStreamCommitUpdated($streamId: String!, $commitId: String) {
    commitUpdated(streamId: $streamId, commitId: $commitId)
  }
`

export const onProjectModelsUpdatedSubscription = gql`
  subscription OnProjectModelsUpdated($projectId: String!, $modelIds: [String!]) {
    projectModelsUpdated(id: $projectId, modelIds: $modelIds) {
      id
      type
      model {
        id
        name
      }
    }
  }
`

export const onBranchCreatedSubscription = gql`
  subscription OnBranchCreated($streamId: String!) {
    branchCreated(streamId: $streamId)
  }
`

export const onBranchUpdatedSubscription = gql`
  subscription OnBranchUpdated($streamId: String!, $branchId: String) {
    branchUpdated(streamId: $streamId, branchId: $branchId)
  }
`

export const onBranchDeletedSubscription = gql`
  subscription OnBranchDeleted($streamId: String!) {
    branchDeleted(streamId: $streamId)
  }
`
export const usersRetrievalQuery = gql`
  query UsersRetrieval($input: UsersRetrievalInput!) {
    users(input: $input) {
      cursor
      items {
        id
        name
      }
    }
  }
`

export const activeUserProjectsQuery = gql`
  query ActiveUserProjects($filter: UserProjectsFilter!, $sortBy: [String!]) {
    activeUser {
      projects(filter: $filter, sortBy: $sortBy) {
        cursor
        items {
          id
          name
        }
      }
    }
  }
`

export const verifyUserEmailMutation = gql`
  mutation VerifyUserEmail($input: VerifyUserEmailInput!) {
    activeUserMutations {
      emailMutations {
        verify(input: $input)
      }
    }
  }
`

export const getProjectWithVersionsQuery = gql`
  query GetProjectWithVersions($id: String!) {
    project(id: $id) {
      id
      name
      workspaceId
      versions {
        items {
          id
          referencedObject
        }
      }
    }
  }
`

export const getProjectWithModelVersionsQuery = gql`
  query GetProjectWithModelVersions($id: String!) {
    project(id: $id) {
      id
      name
      workspaceId
      models {
        items {
          versions {
            items {
              id
              referencedObject
            }
          }
        }
      }
    }
  }
`

export const getNewWorkspaceExplainerDismissedQuery = gql`
  query GetNewWorkspaceExplainerDismissed {
    activeUser {
      meta {
        newWorkspaceExplainerDismissed
      }
    }
  }
`

export const setNewWorkspaceExplainerDismissedMutation = gql`
  mutation SetNewWorkspaceExplainerDismissed($input: Boolean!) {
    activeUserMutations {
      meta {
        setNewWorkspaceExplainerDismissed(value: $input)
      }
    }
  }
`

export const getSpeckleConBannerDismissedQuery = gql`
  query GetSpeckleConBannerDismissed {
    activeUser {
      meta {
        speckleConBannerDismissed
      }
    }
  }
`

export const setSpeckleConBannerDismissedMutation = gql`
  mutation SetSpeckleConBannerDismissed($input: Boolean!) {
    activeUserMutations {
      meta {
        setSpeckleConBannerDismissed(value: $input)
      }
    }
  }
`

export const getIntelligenceCommunityStandUpBannerDismissedQuery = gql`
  query GetIntelligenceCommunityStandUpBannerDismissed {
    activeUser {
      meta {
        intelligenceCommunityStandUpBannerDismissed
      }
    }
  }
`

export const setIntelligenceCommunityStandUpBannerDismissedMutation = gql`
  mutation SetIntelligenceCommunityStandUpBannerDismissed($input: Boolean!) {
    activeUserMutations {
      meta {
        setIntelligenceCommunityStandUpBannerDismissed(value: $input)
      }
    }
  }
`

export const getLegacyProjectsExplainerCollapsedQuery = gql`
  query GetLegacyProjectsExplainerCollapsed {
    activeUser {
      meta {
        legacyProjectsExplainerCollapsed
      }
    }
  }
`

export const setLegacyProjectsExplainerCollapsedMutation = gql`
  mutation SetLegacyProjectsExplainerCollapsed($input: Boolean!) {
    activeUserMutations {
      meta {
        setLegacyProjectsExplainerCollapsed(value: $input)
      }
    }
  }
`

export const updateEmailVerificationMutation = gql`
  mutation AdminMutations($input: AdminUpdateEmailVerificationInput!) {
    admin {
      updateEmailVerification(input: $input)
    }
  }
`
