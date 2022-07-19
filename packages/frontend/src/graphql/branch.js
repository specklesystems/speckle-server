import gql from 'graphql-tag'

export const branchCreatedSubscription = gql`
  subscription BranchCreated($streamId: String!) {
    branchCreated(streamId: $streamId)
  }
`
