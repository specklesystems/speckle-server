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
