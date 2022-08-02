import { gql } from '@apollo/client/core'

export const branchCreatedSubscription = gql`
  subscription BranchCreated($streamId: String!) {
    branchCreated(streamId: $streamId)
  }
`
