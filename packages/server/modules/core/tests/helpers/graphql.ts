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
